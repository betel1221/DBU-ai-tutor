import base64
import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from groq import Groq
from gtts import gTTS 
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Use API key from environment variable
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Global Error Trap
        print("Received chat request...") 

        message = request.form.get("message", "Analyze this")
        image_file = request.files.get("file")
        is_reasoning = request.form.get("reasoning") == 'true'
        history_str = request.form.get("history", "[]")
        profile_str = request.form.get("profile", "{}")
        
        import json
        try:
            history = json.loads(history_str)
        except:
            history = []
            
        try:
            print(f"DEBUG: Received Profile String: {profile_str}") # Debug log
            profile = json.loads(profile_str)
            dept = profile.get("department", "University")
            year = profile.get("batch", "1")
            name = profile.get("firstName", "Student")
            
            from dbu_data import DBU_INFO
            
            # Context Instruction
            system_instruction = {
                "role": "system", 
                "content": f"""You are an expert academic tutor for {name}, a Year {year} student in the {dept} department at Debre Berhan University (DBU). 
                
                YOUR STUDENT CONTEXT:
                - Name: {name}
                - Department: {dept}
                - Year/Batch: {year}

                UNIVERSITY CONTEXT (DBU):
                {DBU_INFO}

                INSTRUCTIONS:
                - Always tailor your examples to the student's field ({dept}).
                - Be encouraging and supportive.
                - If asked about the university, use the provided DBU Context.
                """
            }
        except Exception as e:
            print(f"Profile Parse Error: {e}")
            system_instruction = {"role": "system", "content": "You are a helpful academic AI assistant."}

        if image_file:
            # Model ID: User requested specific model (Llama 4 Scout)
            # Note: If this invalid/not-on-groq, the fallback logic below will handle it.
            model = "meta-llama/llama-4-scout-17b-16e-instruct" 
            image_data = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Note: Vision models might not strictly follow system prompts in all API versions, 
            # but we append it to history.
            
            content = [
                {"type": "text", "text": message},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                }
            ]
            
            # Check if history exists, if not, start with system prompt
            if not history:
                messages = [system_instruction] + [{"role": "user", "content": content}]
            else:
                messages = [system_instruction] + history + [{"role": "user", "content": content}]
                
        else:
            # Use Llama 3.3 70B Versatile (Correct ID)
            model = "llama-3.3-70b-versatile"
            
            content = message
            
            # Combine: System + History + Current
            messages = [system_instruction] + history + [{"role": "user", "content": content}]

        # DEBUG: Print messages
        print(f"Sending to Groq ({model}): {len(messages)} messages")
        
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages
            )
        except Exception as api_err:
            print(f"API Error with Context: {api_err}")
            
            # Smart Fallback for Decommissioned Model
            if "model_decommissioned" in str(api_err) or "400" in str(api_err):
                print("Switching to fallback model: llama-3.2-11b-vision-preview")
                model = "llama-3.2-11b-vision-preview"
                completion = client.chat.completions.create(
                    model=model,
                    messages=messages
                )
            else:
                # Fallback: Try sending just the current message without history/system prompt
                # This ensures the user at least gets a reply even if context fails
                fallback_messages = [{"role": "user", "content": message}]
                completion = client.chat.completions.create(
                    model=model,
                    messages=fallback_messages
                )
            
        return jsonify({"reply": completion.choices[0].message.content})
        
    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"CRITICAL CHAT ERROR: {trace}")
        return jsonify({"reply": f"SYSTEM ERROR: {str(e)}\n\n{trace}"}), 200 # Return 200 so frontend displays it


@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        audio_file = request.files.get("file")
        if not audio_file:
            return jsonify({"error": "No audio file provided"}), 400

        # Official model from your Groq documentation
        model_id = "whisper-large-v3"

        # Use original filename if possible, else default to webm
        filename = audio_file.filename if audio_file.filename else "audio.webm"
        
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_file.read()),
            model=model_id,
            response_format="json"  # Standard JSON response
        )
        
        return jsonify({"text": transcription.text})
        
    except Exception as e:
        print(f"Transcription Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/speak', methods=['POST'])
def speak():
    try:
        text = request.json.get("text")
        tts = gTTS(text=text, lang='en')
        tts.save("speech.mp3")
        return send_file("speech.mp3", mimetype="audio/mpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Get the port from Render's environment, or default to 8000
    port = int(os.environ.get("PORT", 8000))
    # host='0.0.0.0' is REQUIRED for cloud deployment
    app.run(host='0.0.0.0', port=port)