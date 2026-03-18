import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { db } from './firebase';
import {
  collection, addDoc, query, where, getDocs, orderBy, serverTimestamp,
  onSnapshot, doc, updateDoc, deleteDoc
} from "firebase/firestore";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import logo from './logo.png';
import Settings from './Settings';
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://dbu-ai-tutor.onrender.com";

const Dashboard = ({ user, profile, setProfile, theme, setTheme, toggleTheme, colorTheme, setColorTheme }) => {
  // const logo = theme === 'dark' ? logoDark : logoLight; // Removed dynamic logo for now
  // ... rest of state
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([]); // Current messages
  const [conversations, setConversations] = useState([]); // Sidebar list
  const [currentChatId, setCurrentChatId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Desktop Sidebar Collapse State
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ... (existing mobile state)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ... (existing menu state)
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // ... (existing edit state)
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // ... (existing refs)
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  // ... (existing useEffect for conversations match)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      convs.sort((a, b) => (b.isPinned === a.isPinned) ? 0 : b.isPinned ? 1 : -1);
      setConversations(convs);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user]);

  // --- 2. LOAD A SPECIFIC CHAT ---
  const loadChat = async (conv) => {
    setCurrentChatId(conv.id);
    setIsSidebarOpen(false); // Close sidebar on mobile
    setChat([]);
    setLoading(true);

    try {
      const q = query(
        collection(db, "conversations", conv.id, "messages"),
        orderBy("timestamp", "asc")
      );
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const formattedChat = messages.map(msg => ({
        id: msg.id, role: msg.role === 'user' ? 'user' : 'bot', text: msg.content,
        image: msg.image || null, fileName: msg.fileName || null
      }));
      setChat(formattedChat);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setChat([]);
    setInput("");
    setIsSidebarOpen(false);
  };

  // --- REUSABLE AI CALL ---
  const callAI = async (messageText, historyOverride = null, file = null, chatId) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("message", messageText);
      formData.append("reasoning", "false");

      if (profile) {
        formData.append("profile", JSON.stringify({
          department: profile.department || "General",
          batch: profile.batch || "1",
          firstName: profile.firstName || "Student"
        }));
      }

      // Use provided history or current chat state
      const targetChat = historyOverride || chat;
      const history = targetChat
        .filter(msg => msg.text && typeof msg.text === 'string' && msg.text.trim().length > 0)
        .map(msg => ({
          role: msg.role === 'bot' ? 'assistant' : 'user',
          content: msg.text
        }));

      formData.append("history", JSON.stringify(history));
      if (file) formData.append("file", file);

   const res = await axios.post(`${API_BASE_URL}/chat`, formData);
      const botReply = res.data.reply;

      // Save Bot Message
      const botMsgRef = await addDoc(collection(db, "conversations", chatId, "messages"), {
        role: 'assistant', content: botReply, timestamp: serverTimestamp()
      });
      setChat(prev => [...prev, { id: botMsgRef.id, role: 'bot', text: botReply }]);

    } catch (err) {
      console.error(err);
      let errorMessage = "⚠️ Error: Connection failed.";
      if (err.code === 'permission-denied' || JSON.stringify(err).includes('permission-denied')) {
        errorMessage = "⚠️ Error: Permission Denied. Please check Firestore Rules.";
      }
      setChat(prev => [...prev, { id: 'error-' + Date.now(), role: 'bot', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTION: SEND MESSAGE ---
  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    const currentInput = input;
    const currentFile = selectedFile;
    const currentPreview = previewUrl;

    // UI Update immediately
    const tempId = Date.now().toString();
    setChat(prev => [...prev, { id: tempId, role: 'user', text: currentInput, image: currentPreview, fileName: currentFile?.name }]);
    setInput(""); setSelectedFile(null); setPreviewUrl(null);

    try {
      // 1. Ensure Conversation
      let chatId = currentChatId;
      if (!chatId) {
        const docRef = await addDoc(collection(db, "conversations"), {
          userId: user.uid, title: currentInput.substring(0, 30) || "New Conversation",
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPinned: false
        });
        chatId = docRef.id; setCurrentChatId(chatId);
      } else {
        await updateDoc(doc(db, "conversations", chatId), { updatedAt: serverTimestamp() });
      }

      // 2. Save User Message
      const userMsgRef = await addDoc(collection(db, "conversations", chatId, "messages"), {
        role: 'user', content: currentInput, image: currentPreview || null,
        fileName: currentFile?.name || null, timestamp: serverTimestamp()
      });

      // Update UI ID
      setChat(prev => prev.map(msg => msg.id === tempId ? { ...msg, id: userMsgRef.id } : msg));

      // 3. Call AI
      await callAI(currentInput, null, currentFile, chatId);

    } catch (err) { console.error(err); }
  };

  // --- MESSAGE ACTIONS (EDIT / COPY / REGENERATE) ---
  const handleCopy = (text) => navigator.clipboard.writeText(text);

  const startEditing = (msg) => {
    setEditingMsgId(msg.id);
    setEditContent(msg.text);
  };

  const saveEdit = async () => {
    if (!editingMsgId || !currentChatId) return;

    // 1. Find the index of the message being edited
    const msgIndex = chat.findIndex(m => m.id === editingMsgId);
    if (msgIndex === -1) return;

    // 2. Update the text locally & in Firestore
    setChat(prev => prev.map(msg => msg.id === editingMsgId ? { ...msg, text: editContent } : msg));
    await updateDoc(doc(db, "conversations", currentChatId, "messages", editingMsgId), { content: editContent });
    setEditingMsgId(null);

    // 3. REGENERATE LOGIC
    // Check if the NEXT message is a bot response. If so, delete it and regenerate.
    const nextPageMsg = chat[msgIndex + 1];
    if (nextPageMsg && nextPageMsg.role === 'bot') {
      // Remove from UI
      setChat(prev => prev.filter(m => m.id !== nextPageMsg.id));
      // Remove from Firestore
      await deleteDoc(doc(db, "conversations", currentChatId, "messages", nextPageMsg.id));

      // Construct history UP TO the edited message
      const newHistory = chat.slice(0, msgIndex);

      // Trigger Regeneration
      await callAI(editContent, newHistory, null, currentChatId);
    }
  };

  const handleDownloadHTML = (conv) => {
    if (!chat.length) return alert("Load chat first.");
    const htmlContent = `
      <html>
        <head>
          <title>${conv.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
            .msg { margin-bottom: 20px; padding: 15px; border-radius: 10px; }
            .user { background: #f0f9ff; border-left: 4px solid #0284c7; }
            .bot { background: #f9fafb; border-left: 4px solid #4b5563; }
            .meta { font-size: 0.8em; color: #888; margin-bottom: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${conv.title}</h1>
          <hr/>
          ${chat.map(m => `
            <div class="msg ${m.role}">
              <div class="meta">${m.role.toUpperCase()}</div>
              <div>${m.text.replace(/\\n/g, '<br/>')}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/\\s+/g, '_')}.html`;
    a.click();
    setActiveMenuId(null);
  };

  // --- COMMON ACTIONS ---
  const handleDelete = async (e, convId) => {
    e.stopPropagation();
    if (window.confirm("Delete conversation?")) {
      await deleteDoc(doc(db, "conversations", convId));
      if (currentChatId === convId) startNewChat();
    }
    setActiveMenuId(null);
  };
  const handlePin = async (e, conv) => {
    e.stopPropagation(); await updateDoc(doc(db, "conversations", conv.id), { isPinned: !conv.isPinned }); setActiveMenuId(null);
  };
  const startRename = (e, conv) => {
    e.stopPropagation(); setRenamingId(conv.id); setRenameValue(conv.title); setActiveMenuId(null);
  };
  const saveRename = async () => {
    if (renamingId && renameValue.trim()) await updateDoc(doc(db, "conversations", renamingId), { title: renameValue }); setRenamingId(null);
  };

  // --- AUDIO ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = event => audioChunks.current.push(event.data);
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        try {
          const res = await axios.post("http://127.0.0.1:5001/transcribe", formData);
          if (res.data.text) setInput(res.data.text);
        } catch (err) { console.error(err); }
      };
      mediaRecorder.current.start(1000);
      setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };
  const stopRecording = () => { if (mediaRecorder.current && isRecording) { mediaRecorder.current.stop(); setIsRecording(false); } };

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [chat, loading]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null); }
  };

  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // RENDER
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50/50 dark:bg-[#0a0a0a] text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300 overflow-hidden">

      {/* SETTINGS MODAL */}
      {showSettings && (
        <Settings
          user={user} profile={profile} setProfile={setProfile} onClose={() => setShowSettings(false)}
          theme={theme} setTheme={setTheme} toggleTheme={toggleTheme} colorTheme={colorTheme} setColorTheme={setColorTheme}
        />
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#121214] border-b border-gray-200 dark:border-white/5 z-20">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-lg dark:text-white">DBU Bot</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 dark:text-gray-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {/* SIDEBAR (Responsive & Collapsible) */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative ${isCollapsed ? 'md:w-20' : 'md:w-80'} w-80 h-full bg-white/95 dark:bg-[#121214]/95 backdrop-blur-2xl border-r border-gray-200/50 dark:border-white/5 flex flex-col p-4 md:p-6 transition-all duration-300 z-30 shadow-2xl md:shadow-sm`}>

        {/* Sidebar Header & Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-6' : 'justify-between mb-8'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary)]/80 flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
                <img src={logo} alt="Logo" className="w-5 h-5 brightness-200" />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight whitespace-nowrap">DBU Bot</span>
            </div>
          )}
          {/* Desktop Toggle Button */}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[var(--color-primary)] transition-colors">
            {isCollapsed ? (
              // Expand Icon
              // Using a simple logo icon or arrow when collapsed
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary)]/80 flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/20">
                <img src={logo} alt="Logo" className="w-5 h-5 brightness-200" />
              </div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            )}
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className={`w-full py-4 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)] bg-transparent text-gray-500 dark:text-gray-400 font-semibold transition-all text-sm mb-6 flex items-center justify-center gap-2 group hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)] ${isCollapsed ? 'px-0' : ''}`}
          title="New Conversation"
        >
          <span className="text-lg">+</span>
          {!isCollapsed && <span>New Conversation</span>}
        </button>

        {/* Mobile Close Button */}
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-gray-400">✕</button>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-none space-y-1">
          {conversations.length === 0 ? (
            !isCollapsed && <div className="text-center mt-12 opacity-40 text-xs italic">Start a new chat</div>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => loadChat(conv)} className={`group relative p-3.5 rounded-xl text-sm cursor-pointer transition-all flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border ${currentChatId === conv.id ? 'bg-white dark:bg-white/5 shadow-sm border-gray-100 dark:border-white/5 text-gray-900 dark:text-white' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5'}`}>

              {isCollapsed ? (
                // Collapsed Item: Tooltip on hover could be added (using title attr for now)
                <div title={conv.title} className="relative">
                  {conv.isPinned && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] absolute -top-0.5 -right-0.5 animate-pulse" />}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
              ) : (
                // Expanded Item
                <>
                  <div className="flex items-center gap-3 overflow-hidden w-full">
                    {conv.isPinned && <div className="w-1 h-8 rounded-full bg-[var(--color-primary)] absolute left-0 top-1/2 -translate-y-1/2" />}
                    {renamingId === conv.id ? (
                      <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={saveRename} onKeyDown={(e) => e.key === 'Enter' && saveRename()} onClick={(e) => e.stopPropagation()} className="bg-transparent border-b-2 border-[var(--color-primary)] outline-none w-full" />
                    ) : <span className="truncate font-medium">{conv.title}</span>}
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 md:opacity-0 p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all text-gray-500" onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === conv.id ? null : conv.id); }}>•••</button>
                </>
              )}

              {/* Dropdown Menu (Only in expanded mode or adjust positioning for collapsed - creating simpler UX: disable menu in collapsed or keep it tricky. keeping simple: expanded only for actions for now, user can expand to edit) */}
              {!isCollapsed && activeMenuId === conv.id && (
                <div className="absolute right-2 top-full mt-1 w-40 bg-white dark:bg-[#1a1a1d] rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden animate-slide-down origin-top-right p-1.5">
                  <MenuItem onClick={(e) => startRename(e, conv)} icon={<EditIcon />} label="Rename" />
                  <MenuItem onClick={(e) => handleDownloadHTML(conv)} icon={<DownloadIcon />} label="Download" />
                  <MenuItem onClick={(e) => handlePin(e, conv)} icon={<PinIcon />} label={conv.isPinned ? "Unpin" : "Pin"} />
                  <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                  <MenuItem onClick={(e) => handleDelete(e, conv.id)} icon={<TrashIcon />} label="Delete" isDestructive />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Profile / Settings Footer */}
        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-3.5 bg-gray-50/50 dark:bg-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer group`} onClick={() => setShowSettings(true)}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5 flex items-center justify-center font-bold text-gray-700 dark:text-white shrink-0">{profile?.displayName?.[0] || 'U'}</div>

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.department || "Student"}</p>
                </div>
                <SettingsIcon className="text-gray-400 group-hover:text-[var(--color-primary)]" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50/30 dark:bg-black/20 w-full">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
          {chat.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up px-4">
              <div className="relative mb-8 group">
                {/* Glowing backdrop for main logo */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--color-primary)] to-blue-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/50 dark:border-white/10 shadow-2xl backdrop-blur-sm animate-float">
                  <img src={logo} className="w-20 md:w-24 drop-shadow-2xl" alt="logo" />
                </div>
              </div>

              <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-6 tracking-tight">
                Hi, {profile?.firstName || "Scholar"}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-lg text-lg md:text-xl leading-relaxed font-light">
                I'm your intelligent <span className="font-bold text-[var(--color-primary)]">{profile?.department}</span> companion. <br />
                Ready to excel? Ask me anything.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 md:gap-8 max-w-3xl mx-auto py-4">
              {chat.map((msg, idx) => (
                <div key={idx} className={`group flex gap-3 md:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/5'}`}>{msg.role === 'user' ? (profile?.firstName?.[0] || 'U') : <img src={logo} className="w-4 md:w-5 opacity-80" alt="bot" />}</div>
                  <div className={`max-w-[85%] md:max-w-[80%] space-y-2 relative`}>
                    {msg.image && <img src={msg.image} className="max-w-xs md:max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm" alt="upload" />}

                    {editingMsgId === msg.id ? (
                      <div className="flex flex-col gap-2 animate-fade-in-up min-w-[250px]">
                        <textarea className="w-full p-4 rounded-xl border border-[var(--color-primary)] bg-white dark:bg-[#18181b] text-gray-800 dark:text-white text-sm md:text-base outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingMsgId(null)} className="text-xs text-gray-500 px-3 py-1">Cancel</button>
                          <button onClick={saveEdit} className="text-xs bg-[var(--color-primary)] text-white px-3 py-1 rounded-lg font-medium">Save & Regenerate</button>
                        </div>
                      </div>
                    ) : (
                      <div className={`p-4 md:p-5 rounded-2xl shadow-sm leading-relaxed text-sm md:text-[15px] relative group-hover:shadow-md transition-all ${msg.role === 'user' ? 'bg-[var(--color-primary)] text-white rounded-tr-none' : 'bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}>
                        {msg.role === 'bot' && <button onClick={() => handleCopy(msg.text)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400" title="Copy"><CopyIcon /></button>}
                        {msg.role === 'user' && msg.id && <button onClick={() => startEditing(msg)} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white" title="Edit"><EditIconSmall /></button>}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
              {loading && <div className="flex gap-4 animate-pulse"><div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" /><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" /><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100" /><span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200" /></div></div>}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-transparent">
          <div className="max-w-3xl mx-auto relative bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl shadow-gray-200/20 dark:shadow-none transition-all">
            {previewUrl && <div className="absolute -top-14 md:-top-16 left-0 bg-white dark:bg-[#18181b] p-2 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg flex items-center gap-3 animate-fade-in-up"><img src={previewUrl} className="w-10 h-10 rounded-lg object-cover" alt="prev" /><button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="hover:bg-red-50 text-red-500 rounded p-1">✕</button></div>}
            <div className="flex items-center px-3 py-2 md:px-4 md:py-3 gap-2 md:gap-3">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileInputRef.current?.click()} className={`p-2 md:p-2.5 rounded-xl transition-colors ${selectedFile ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg></button>
              <button onClick={isRecording ? stopRecording : startRecording} className={`p-2 md:p-2.5 rounded-xl transition-all ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg></button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message DBU Bot..." className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 font-medium text-sm md:text-[15px]" />
              <button onClick={sendMessage} disabled={!input.trim() && !selectedFile} className="p-2 md:p-2.5 rounded-xl bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all transform active:scale-95"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-4 opacity-50">DBU AI Bot v1.2 • Empowering Students</p>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (Icons & Menu) ---
const MenuItem = ({ onClick, icon, label, isDestructive }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors rounded-lg ${isDestructive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
    <span className="opacity-70">{icon}</span> {label}
  </button>
);

const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const PinIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" /></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const SettingsIcon = ({ className }) => <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const EditIconSmall = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>;

export default Dashboard;