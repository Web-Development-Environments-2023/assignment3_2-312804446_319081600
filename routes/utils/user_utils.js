const DButils = require("./DButils");

/**
 * execute SQL query to add a recipe to the favorites table
 * @param {int} user_id 
 * @param {int} recipe_id 
 */
async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into favoriterecipes values ('${user_id}',${recipe_id})`);
}
/**
 * execute SQL query to get the favorite recipes of the given user_id
 * @param {int} user_id 
 */
async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriterecipes where user_id='${user_id}'`);
    return recipes_id;
}
/**
 * execute SQL query to check if a recipe_id and user_id exists in the favorits table
 * @param {int} user_id 
 * @param {int} recipe_id 
 */
async function checkIsFavorite(user_id,recipe_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favoriterecipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`);
    if(recipes_id.length > 0){ 
        return true; 
    }
    return false;
}
/**
 * execute SQL query to add a recipe to the last_recipes table
 * @param {int} user_id 
 * @param {int} recipe_id 
 */
async function markAsLastWatched(user_id, recipe_id){
    await DButils.execQuery(`insert into last_recipes values ('${user_id}',${recipe_id})`);
}
/**
 * execute SQL query to get last watches recipes of a specific user_id. 
 * slice the result to get 3 last watched recipes.
 * @param {int} user_id 
 */
async function getLastWatchedRecipes(user_id){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id FROM last_recipes where user_id='${user_id}'`);
    if(recipes_id.length < 3){
        return recipes_id;
    }
    return recipes_id.slice(-3);
}
/**
 * execute SQL query to check if the recipe_id alreasy watched by the user_id
 * return true or false
 * @param {*} user_id 
 * @param {*} recipe_id 
 */
async function checkIsWatched(user_id,recipe_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from last_recipes where user_id='${user_id}' AND recipe_id='${recipe_id}'`);
    if(recipes_id.length > 0){ 
        return true; 
    }
    return false;
}

/**
 * execute SQL query to get a list of recipes details as JSON object created by the user_id
 * @param {int} user_id 
 */
async function getCreatedRecipes(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id as id, title,image,readyInMinutes, aggregateLikes, vegan, vegetarian, glutenFree from recipes where user_id='${user_id}' and title not like 'family%'`);
    return recipes_details;
}
/**
 * execute SQL query to get a list of family recipes details as JSON object of the saved for the user_id
 * @param {int} user_id 
 */
async function getFamilyRecipes(user_id){
    const recipes_details = await DButils.execQuery(`select recipe_id as id, title,image,readyInMinutes, aggregateLikes, vegan, vegetarian, glutenFree from recipes where user_id='${user_id}' and title like 'family%'`);
    return recipes_details;
}
/**
 * execute SQL query to get full details if a given recipe_id as JSON object
 * @param {int} recipe_id 
 */
async function getFullRecipeDetails(recipe_id){
    const recipes_details = await DButils.execQuery(`select recipe_id as id, title,image,servings, readyInMinutes, aggregateLikes, vegan, vegetarian, glutenFree, instructions from recipes where recipe_id='${recipe_id}'`);
    const recipes_ingredients = await DButils.execQuery(`select ingredient_name,amount from recipe_ingredients where recipe_id='${recipe_id}'`);
    recipes_details[0]["extendedIngredients"] = recipes_ingredients;
    let is_favorite = await checkIsFavorite(recipe_id);
    let is_watched = await checkIsWatched(recipe_id);
    recipes_details[0]["is_favorite"]=is_favorite;
    recipes_details[0]["is_watched"]=is_watched;
    return recipes_details;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getCreatedRecipes = getCreatedRecipes;
exports.markAsLastWatched = markAsLastWatched;
exports.getLastWatchedRecipes = getLastWatchedRecipes;
exports.getFullRecipeDetails =getFullRecipeDetails;
exports.checkIsFavorite=checkIsFavorite;
exports.checkIsWatched =checkIsWatched;
exports.getFamilyRecipes = getFamilyRecipes;