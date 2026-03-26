require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { generateText } = require('ai');

const app = express();

// שימוש ב-CORS וב-JSON
app.use(cors());
app.use(express.json());

console.log('Connected to MongoDB-BEFORE-11');
const DB_URL = process.env.DB_URL;
console.log('Connected to MongoDB-BEFORE');
mongoose.connect(DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log(err));
console.log('Connected to MongoDB-AFTER');
// סכמת מתכון
const recipeSchema = new mongoose.Schema({
    title: String,
    ingredients: [String],
    instructions: String,
});

const RecipeModel = mongoose.model('Recipe', recipeSchema);

// Routes
app.get('/recipes', async (req, res) => {
    try {
        const recipes = await RecipeModel.find();
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/recipes', async (req, res) => {
    try {
        const recipe = new RecipeModel({
            title: req.body.title,
            ingredients: req.body.ingredients,
            instructions: req.body.instructions
        });
        await recipe.save();
        res.send({ message: 'Recipe created' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/recipes/generate', async (req, res) => {
    try {
        const title = req.body.title;
        const ingredients = req.body.ingredients;
        console.log("title: ", title);
        console.log("ingredients: ", ingredients);

        const { text } = await generateText({
            model: "anthropic/claude-sonnet-4.5",
            prompt: `Write a short recipe for "${title}" using these ingredients: ${ingredients}. Limit to 20 words.`
        });

        console.log("text: ", text);
        res.send({ recipe: text });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/recipes/:id', async (req, res) => {
    try {
        const recipe = await RecipeModel.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json(recipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/recipes/:id', async (req, res) => {
    try {
        const recipe = await RecipeModel.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                ingredients: req.body.ingredients,
                instructions: req.body.instructions,
            },
            { new: true, runValidators: true }
        );
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json({ message: 'Recipe updated', recipe });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/recipes/:id', async (req, res) => {
    try {
        await RecipeModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Recipe deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/', (req, res) => {
    console.log("Hello World-11");
    res.send({ message: 'Hello World-11' });
});

// שימוש בפורט מה-Environment (ל-Vercel) או פורט לוקלי
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});