
const dogAPiClient = require('../util/clinet.getBreed');
function getValue(object, path) {
    return path.split('.').reduce((value, key) => value?.[key], object);
}

function isNumber(value) {
    return value !== undefined && value !== null && value !== '' && Number.isFinite(Number(value));
}

async function getBreeds(field, min, max, page = 1, limit = 10) {
    const breeds = await dogAPiClient.getAllBreeds();

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new Error('page must be a positive integer');
    }

    if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error('limit must be a positive integer');
    }

    let filteredBreeds = breeds;

    if (field) {
        if (!isNumber(min) || !isNumber(max)) {
            throw new Error('Invalid min or max value');
        }

        const minValue = Number(min);
        const maxValue = Number(max);

        if (minValue > maxValue) {
            throw new Error('min must be less than or equal to max');
        }

        filteredBreeds = breeds.filter(breed => {
            const value = getValue(breed.attributes, field);

            if (isNumber(value)) {
                const numericValue = Number(value);
                return numericValue >= minValue && numericValue <= maxValue;
            }

            if (value && typeof value === 'object' && isNumber(value.min) && isNumber(value.max)) {
                return Number(value.min) >= minValue && Number(value.max) <= maxValue;
            }

            return false;
        });
    }

    const total = filteredBreeds.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (pageNumber - 1) * pageSize;

    return {
        data: filteredBreeds.slice(start, start + pageSize),
        pagination: {
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages
        }
    };
}

module.exports = { getBreeds };