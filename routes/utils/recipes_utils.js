const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const user_utils = require("./user_utils");

/**
 * Get recipe details from spooncular API 
 * @param {int} recipe_id number of the recipe to get the info for
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

/**
 * Get recipe details from spooncular API and extract the relevant recipe data for preview as JSON object
 * @param {int} recipe_id number of the recipe to get the info for
 */
async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,servings } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,       
        servings:servings
    }
}

/**
 * return 5 random recipes from spooncular API 
 */
async function getRandomRecipes() {
    const response = await axios.get(`${api_domain}/random`,{
        params: {
            number:5,
            apiKey: process.env.spooncular_apiKey
        }
    });
    return response;
}

/**
* filter the random recipes from spooncular API to make sure
* the recipes have an image and instructions. return the preview
* of 3 random recipes.
*/
async function getRandomThreeRecipes(){
    let random_pool = await getRandomRecipes();
    let filterd_random_pool = random_pool.data.recipes.filter((random)=>(random.instructions != "") && (random.image != "") && random.image)
    if(filterd_random_pool.length < 3){
        return getRandomThreeRecipes();
    }
    return extractPreviewRecipeDetails([filterd_random_pool[0], filterd_random_pool[1], filterd_random_pool[2]]);
}

/** 
* returns a list of recipe preview details from spooncular API 
* by the recipes_ids_list.
* @param  {array} recipes_ids_list array of recipe id's
* @param  {int} user_id id of the user connected to the website
*/
async function getRecipesPreview(recipes_ids_list,user_id){
    let promises =[];
    recipes_ids_list.map((id)=>{
        promises.push(getRecipeInformation(id));
    });
    let info_res = await Promise.all(promises);
    return extractPreviewRecipeDetails(info_res,user_id);
}

/** 
* returns a list of recipe details from spooncular API as JSON object
* by the recipes_ids_list.
* @param  {JSON} recipes_info a specific recipe info 
* @param  {int} user_id id of the user connected to the website
*/
async function extractPreviewRecipeDetails(recipes_info,user_id){
    //check the data type so it can work with diffrent types of data
    return await Promise.all(recipes_info.map(async (recipe_info)=> {
        let data = recipe_info;
        if(recipe_info.data){
            data = recipe_info.data;
        }
        const{ id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,servings } = data;
        let is_favorite = await  user_utils.checkIsFavorite(user_id,id);
        let is_watched =  await user_utils.checkIsWatched(user_id,id);
        return{
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            aggregateLikes: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree, 
            is_favorite:is_favorite,
            is_watched:is_watched,
            servings: servings
        }
    }))
}
/** 
* return array of search result recipes, filtered to check that the analyzedInstructions is not empty. 
* @param  {string} query the query string the user inserted to the search input
* @param  {int} number the number of recipes the user chose in the search. the default is 5.
* @param  {string} cuisine the cuisine the user chose in the search.
* @param  {string} diet the diet the user chose in the search.
* @param  {string} intolerance the intolerance the user chose in the search.
* @param  {string} sort the sort type the user chose in the search.
* @param  {int} user_id id of the user connected to the website
* @param  {int} counter number for checking the count of filterd recipes is the same like the number the user chose.
*/
async function getFilteredSearchRecipes(query, number, cuisine, diet, intolerance,sort,user_id,counter){
    if(number === undefined){
        number=5;
    }
    let searchRes = await getRecipesFromSearch(query, number, cuisine, diet, intolerance,sort) ;
    let filterdSearchRes = searchRes.results.filter((random)=>(random.analyzedInstructions.length != 0))
    if(filterdSearchRes.length < number - counter && searchRes.totalResults >= number){
        counter++;
        return getFilteredSearchRecipes(query, number+1, cuisine, diet, intolerance,sort,user_id,counter);
    }
    return extractPreviewRecipeDetails(filterdSearchRes,user_id);
}

/** 
* creates the search url by the users chooses of the search parameters
* and returns the search results from spooncular API
* @param  {string} query the query string the user inserted to the search input
* @param  {int} number the number of recipes the user chose in the search. the default is 5.
* @param  {string} cuisine the cuisine the user chose in the search.
* @param  {string} diet the diet the user chose in the search.
* @param  {string} intolerance the intolerance the user chose in the search.
* @param  {string} sort the sort type the user chose in the search.
* @param  {int} user_id id of the user connected to the website
*/
async function getRecipesFromSearch(query, number, cuisine, diet, intolerance,sort) { 
    let search_url= `${api_domain}/complexSearch/?`
    if(query !== undefined){
        search_url = search_url + `&query=${query}`
    }
    if(cuisine !== undefined){
        search_url = search_url + `&cuisine=${cuisine}`
    }
    if(diet !== undefined){
        search_url = search_url + `&diet=${diet}`
    }
    if(intolerance !== undefined){
        search_url = search_url + `&intolerance=${intolerance}`
    }
    if(sort !== undefined){
        search_url = search_url + `&sort=${sort}`
    }
    search_url = search_url + `&instructionsRequired=true&addRecipeInformation=true` 
    if(number !== undefined){
        search_url = search_url + `&number=${number}`
    }
    const response = await axios.get(search_url,{
        params: {
            number: 5,
            apiKey: process.env.spooncular_apiKey
        }
    });
    return response.data;
}

/**
 * returns full recipe details as JSON object
 * @param {int} user_id number that represents a connected user
 * @param {int} recipe_id number that represents a recipe
 */
async function getFullRecipeDetails(user_id,recipe_id){
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,analyzedInstructions,extendedIngredients,servings } = recipe_info.data;
    let ingredients_dict = [];
    extendedIngredients.map((element) => ingredients_dict.push({
        name: element.name,
        amount: element.amount,
    }))
    let is_favorite = await  user_utils.checkIsFavorite(user_id,id);
    let is_watched =  await user_utils.checkIsWatched(user_id,id);
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        is_favorite:is_favorite,
        is_watched:is_watched, 
        servings:servings,
        instructions: analyzedInstructions,
        extendedIngredients: ingredients_dict
    }
}

exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRandomThreeRecipes = getRandomThreeRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipesFromSearch = getRecipesFromSearch;
exports.getFullRecipeDetails = getFullRecipeDetails;
exports.getFilteredSearchRecipes =getFilteredSearchRecipes;