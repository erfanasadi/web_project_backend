
const express = require("express");
const db = require("./db/db");
const axios = require("axios");
const fs = require("fs")


const app = express();

app.use(express.json());


const createTablesQuery = fs.readFileSync('./sql/init_sql.sql').toString()
const createDbSchema = async function () {
    await db.query(createTablesQuery)
}

createDbSchema();


app.get("/flight/:date/:origin/:destination", async (req, res) => {
       console.log(req.params)
     if (req.params.date.match("^\d{4}-\d{2}-\d{2}$")) {
         return res.status(400).json({
             "massage":"aa",
             status: "date is invalid"
     });
     }
    const flights = await db.query("select * from available_offers where origin = $1 AND destination = $2 AND date_trunc('day',departure_local_time) =  $3 limit 5", [req.params.origin, req.params.destination, req.params.date])
    console.log(flights.rows)
    res.status(200).json({
        status: "success",
        results: flights.length,
        data: {
            flights: flights.rows,
        },
    });

});
app.get("/purchase", async (req, res) => {
    console.log(req.headers.authorization);
    const axiosResponse = await axios.get('http://localhost:3000//isTokenValid', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })
    if(axiosResponse.data === "token is invalid") {
        res.status(200).json({
            data:{

                "mwssage": "token is invalid"
            }
        });
    }
        else{
            res.status(200).json({
                data:{
                    "message":axiosResponse.data
                }
        });
    }


});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});
