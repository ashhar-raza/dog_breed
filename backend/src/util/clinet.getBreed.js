


const BASE_URL = 'https://dogapi.dog/api/v2/breeds';


async function getBreedClient(page,size){

    const response = await fetch(`${BASE_URL}?page[number]=${page}&&page[size]=${size}`);
    const data = await response.json();
    return data;
}

async function getAllBreeds() {
    let page = 1;
    let size = 100;
    let lastPage = 1;

    const allBreeds = [];

    while(page <= lastPage) {
        const breeds = await getBreedClient(page, size);
        allBreeds.push(...breeds.data);
        lastPage = Math.ceil(allBreeds.length / size);
        page++;
    }

    return allBreeds;
}

module.exports = { getAllBreeds };