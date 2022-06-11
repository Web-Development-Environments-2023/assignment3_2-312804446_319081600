const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

// get one recipe details from spooncular API
async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,       
    }
}


async function getRandomRecipes() {
    const response = await axios.get(`${api_domain}/random`,{
        params: {
            number:10,
            apiKey: process.env.spooncular_apiKey
        }
    });
    return response;
}

// get recipe details from spooncular API
async function getRandomThreeRecipes(){
    let random_pool = await getRandomRecipes();
    let filterd_random_pool = random_pool.data.recipes.filter((random)=>(random.instructions != "") && random.image && random.title && random.readyInMinutes && random.aggregateLikes && random.vegan 
    && random.vegetarian && random.glutenFree)
    if(filterd_random_pool.length < 3){
        return getRandomThreeRecipes();
    }
    return extractPreviewRecipeDetails([filterd_random_pool[0], filterd_random_pool[1], filterd_random_pool[2]]);
}

// get list of recipe details from spooncular API
async function getRecipesPreview(recipes_ids_list){
    let promises =[];
    recipes_ids_list.map((id)=>{
        promises.push(getRecipeInformation(id));
    });
    let info_res = await Promise.all(promises);
    return extractPreviewRecipeDetails(info_res);
}
// do not show the is_watched and is_favorite flag here - cause the random route is using this
function extractPreviewRecipeDetails(recipes_info){
    //check the data type so it can work with diffrent types of data
    return recipes_info.map((recipe_info)=> {
        let data = recipe_info;
        if(recipe_info.data){
            data = recipe_info.data;
        }
        const{ id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = data;
        return{
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            aggregateLikes: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,  
        }
    })
}
////////get the recipes from the API spooncular
// number: if not choosen send default 5 
// query: the recipe name
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
    return extractPreviewRecipeDetails(response.data.results);
}


// function extractPreviewRecipeDetails(recipes_info){
//     //check the data type so it can work with diffrent types of data
//     return recipes_info.map((recipe_info)=> {
//         let data = recipe_info;
//         if(recipe_info.data){
//             data = recipe_info.data;
//         }
//         const{ id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = data;
//         return{
//             id: id,
//             title: title,
//             readyInMinutes: readyInMinutes,
//             image: image,
//             aggregateLikes: aggregateLikes,
//             vegan: vegan,
//             vegetarian: vegetarian,
//             glutenFree: glutenFree,  
//         }
//     })
// }

async function getFullRecipeDetails(recipe_id){
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree,analyzedInstructions,extendedIngredients } = recipe_info.data;
    let ingredients_dict = [];
    extendedIngredients.map((element) => ingredients_dict.push({
        name: element.name,
        amount: element.amount,
    }))
    
    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        aggregateLikes: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree, 
        analyzedInstructions: analyzedInstructions,
        extendedIngredients: ingredients_dict
    }

}



exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getRandomRecipes;
exports.getRandomThreeRecipes = getRandomThreeRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipesFromSearch = getRecipesFromSearch;
exports.getFullRecipeDetails = getFullRecipeDetails;



