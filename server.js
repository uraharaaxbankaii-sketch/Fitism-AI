import express from "express";
import multer from "multer";
import OpenAI from "openai";
import cors from "cors";

const app = express();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());


app.get("/", (req, res) => {

    res.json({
        status: "Fitism AI backend is running"
    });

});


app.post(
    "/analyze-food",
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    error: "No image uploaded."
                });

            }


            const base64Image =
                req.file.buffer.toString("base64");


            const imageData =
                `data:${req.file.mimetype};base64,${base64Image}`;


            const response =
                await client.responses.create({

                    model: "YOUR_VISION_MODEL",

                    input: [

                        {
                            role: "user",

                            content: [

                                {
                                    type: "input_text",

                                    text: `
Analyze the food shown in this image.

Identify the most likely food.

Estimate the portion visible.

Estimate:
- calories in kcal
- protein in grams
- carbohydrates in grams
- fat in grams

Return ONLY valid JSON.

Use exactly this format:

{
  "food": "food name",
  "portion": "estimated portion",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0
}

Do not include markdown.
Do not include explanations.

Nutrition values are estimates because
a photograph cannot determine exact
ingredients or weight.
`
                                },

                                {
                                    type: "input_image",
                                    image_url: imageData
                                }

                            ]

                        }

                    ]

                });


            let result;


            try {

                result =
                    JSON.parse(
                        response.output_text
                    );

            } catch {

                return res.status(500).json({
                    error:
                        "AI returned an invalid result."
                });

            }


            res.json({

                food:
                    String(
                        result.food ||
                        "Unknown food"
                    ),

                portion:
                    String(
                        result.portion ||
                        "Unknown portion"
                    ),

                calories:
                    Number(
                        result.calories
                    ) || 0,

                protein:
                    Number(
                        result.protein
                    ) || 0,

                carbs:
                    Number(
                        result.carbs
                    ) || 0,

                fat:
                    Number(
                        result.fat
                    ) || 0

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Food analysis failed."
            });

        }

    }
);


const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Fitism backend running on port ${PORT}`
    );

});
