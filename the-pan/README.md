# The Pan
1. `npm i`  2. copy `.env.example` to `.env.local`, fill in MongoDB Atlas URI, JWT secret, ADMIN_USERNAME (that username becomes admin when it registers)
3. `npm run dev`. Deploy: push to GitHub, import in Vercel, add the same 3 env vars. In Atlas, allow network access 0.0.0.0/0 for Vercel.
Next steps: media uploads (Vercel Blob), live A/V (LiveKit/Agora, wire into Room), TTS voices, push notifications.
