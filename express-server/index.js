
const express = require("express");
const db = require("./db/db");


const app = express();


app.use(express.json());
app.get("/aa",async (req, res) => {
    console.log("aaa")
});

app.get("/aa/:date/:origin/:destination", async (req, res) => {
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

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});