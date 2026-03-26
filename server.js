require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { generateText } = require('ai');

const app = express();

app.use(cors());
app.use(express.json());

// יצירת connection יחידה שנשמרת
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    console.log('Creating new MongoDB connection');
    const DB_URL = process.env.DB_URL;
    
    const connection = await mongoose.connect(DB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (err) {
    console.log('MongoDB connection error:', err);
    throw err;
  }
}

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
        await connectToDatabase();
        const recipes = await RecipeModel.find();
        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/recipes', async (req, res) => {
    try {
        await connectToDatabase();
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

app.get('/recipes/:id', async (req, res) => {
    try {
        await connectToDatabase();
        const recipe = await RecipeModel.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json(recpe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/recipes/:id', async (req, res) => {
    try {
        await connectToDatabase();
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
        await connectToDatabase();
        await RecipeModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Recipe deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/recipes/generate', async (req, res) => {
    try {
        await connectToDatabase();
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

app.get('/', (req, res) => {
    console.log("Hello World-11");
    res.send({ message: 'Hello World-11' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});