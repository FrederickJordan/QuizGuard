export default {
  async fetch(request, env) {

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400,
        headers: corsHeaders
      });
    }
    if (!env.HF_API_KEY) {
      return new Response(
        JSON.stringify({
          feedback: "HF_API_KEY is missing in the worker environment.",
          error: true
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    const { wrongAnswers } = payload;

    if (!Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
      return new Response("Missing fields", {
        status: 400,
        headers: corsHeaders
      });
    }

    const answersList = wrongAnswers
      .map((item, index) => `Question ${index + 1}: ${item.question}\nSelected answer: ${item.selectedAnswer}\nCorrect answer: ${item.correctAnswer}`)
      .join('\n\n');

    const prompt = `
You are a friendly quiz tutor.

The student answered some questions incorrectly. For each question below, explain briefly why the selected answer is wrong and why the correct answer is right.

${answersList}

Respond with a short numbered list, one item per question. Use simple language and be encouraging.
`;

    let result;
    try {
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/google/flan-t5-base",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: prompt,
            options: {
              wait_for_model: true
            }
          })
        }
      );

      if (!hfResponse.ok) {
        const errorText = await hfResponse.text();
        return new Response(
          JSON.stringify({
            feedback: `AI service returned ${hfResponse.status}.`,
            error: true,
            detail: errorText
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      result = await hfResponse.json();
    } catch (err) {
      return new Response(
        JSON.stringify({
          feedback: "AI service request failed.",
          error: true,
          detail: err.message
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }
    const feedback =
      Array.isArray(result) &&
      result[0]?.generated_text
        ? result[0].generated_text
        : "AI feedback unavailable.";

    return new Response(
      JSON.stringify({ feedback }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
}
