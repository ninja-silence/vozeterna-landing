export async function POST(request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        message:
          "ElevenLabs API key is not configured. Add ELEVENLABS_API_KEY to .env.local and Vercel environment variables.",
      },
      { status: 500 }
    );
  }

  /*
    Important:
    This route is intentionally a safe placeholder.

    Next step:
    - Confirm ElevenLabs account
    - Confirm the exact voice cloning API requirements
    - Send only consent-approved voice samples
    - Store consent record before cloning
    - Never expose ELEVENLABS_API_KEY to the browser
  */

  return Response.json({
    ok: false,
    message:
      "Voice cloning endpoint placeholder created. ElevenLabs integration will be connected after consent storage and API configuration.",
  });
}