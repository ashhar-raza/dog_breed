

const services = require('../services/breed.service');
async function getBreeds(req , res)
{
    try 
    {
        const {field , min , max, page = '1', limit = '10'} = req.query;
        // console.log(`field: ${field}, min: ${min}, max: ${max}`);

        const result = await services.getBreeds(field , min , max, page, limit);
        res.status(200).json(result);
    }
    catch (error)
    {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
}

module.exports = { getBreeds };