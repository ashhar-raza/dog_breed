const express = require('express');
const breedRoutes = require('./src/route/breed.route');
const cors = require('cors');


const app = express();

app.use(cors({
    origin: '*'
} ));


app.use('/api/breeds', breedRoutes);
app.use('/healthcheck', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' });
});

app.listen(7000, () => {console.log('Server is running on port 7000')});



