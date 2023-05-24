import express from "express";
import peliculasRoutes from "./routes/peliculas.routes.js";

const app = express();
const port = 3000
//settings

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(port, ()=> {console.log('server running on port: ', port)})

app.use('/book', peliculasRoutes);


