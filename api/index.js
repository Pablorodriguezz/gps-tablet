// Archivo: server.js
const express = require('express');
const mongoose = require('mongoose');

// =================================================================
// ⚠️ CAMBIO CRUCIAL: Leer la URI de la Variable de Entorno
// La URI se configurará como una variable secreta en Google Cloud Run
const mongoURI = process.env.MONGO_URI; 
// =================================================================

const port = process.env.PORT || 8080;
const app = express();

app.use(express.json()); 

// Conexión a MongoDB Atlas
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Conexión a MongoDB Atlas exitosa.'))
    .catch(err => console.error('❌ Error de conexión a DB:', err));

// --- 2. Definición del Esquema (Modelo de Datos) ---
const ubicacionSchema = new mongoose.Schema({
    idComercial: { type: String, required: true, index: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Ubicacion = mongoose.model('Ubicacion', ubicacionSchema);

// --- 3. Endpoint para Recibir Datos (POST) ---
app.post('/reportar_ubicacion', async (req, res) => {
    try {
        const { idComercial, latitud, longitud } = req.body;

        if (!idComercial || !latitud || !longitud) {
            return res.status(400).send({ message: 'Faltan campos requeridos (idComercial, latitud, longitud).' });
        }

        const nuevoRegistro = new Ubicacion({ idComercial, latitud, longitud });
        await nuevoRegistro.save();

        res.status(201).send({ message: 'Ubicación registrada con éxito.' });
    } catch (error) {
        console.error('Error al guardar ubicación:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// --- 4. Endpoint para Consultar Datos (GET) ---
app.get('/ubicaciones_actuales', async (req, res) => {
    try {
        const ultimasUbicaciones = await Ubicacion.aggregate([
            { $sort: { timestamp: -1 } }, 
            {
                $group: {
                    _id: "$idComercial",
                    latitud: { $first: "$latitud" },
                    longitud: { $first: "$longitud" },
                    timestamp: { $first: "$timestamp" }
                }
            }
        ]);

        res.status(200).json(ultimasUbicaciones);
    } catch (error) {
        console.error('Error al obtener últimas ubicaciones:', error);
        res.status(500).send({ message: 'Error interno al consultar ubicaciones.' });
    }
});

// --- 5. Inicialización del Servidor ---
app.get('/', (req, res) => {
    res.send('Servidor GPS HORECA operativo. Endpoints: /api/reportar_ubicacion (POST) y /api/ubicaciones_actuales (GET).');
});

// ⚠️ CAMBIO CRUCIAL: Exportar la aplicación Express para Vercel
module.exports = app;