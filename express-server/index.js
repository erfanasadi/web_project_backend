
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
            "massage": "aa",
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

app.post("/purchase", async (req, res) => {
    console.log(req.headers.authorization);
    const axiosResponse = await axios.get('http://localhost:3000/isTokenValid', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })
    if (axiosResponse.data === "token is invalid") {
        res.status(401).json({
            data: {

                "message": "token is invalid"
            }
        });
    }
    else {
        let transactionIdResponse;
        try {
            transactionIdResponse = await axios.post('http://127.0.0.1:8000/transaction/', {
                "amount": req.body.offer_price,
                "receipt_id": 23,
                "callback": "https://google.com"
            })
        } catch (error) {
            console.log(error);
        }

        transactionId = transactionIdResponse.data.id;
        successTransactionResult = 1;

        // make transaction successfull in bank
        // try {
        //         await axios.get('http://localhost:8000/payed/' + transactionId + '/' + successTransactionResult);
        // } catch (error) {
        //     console.log(error);
        // }

        let userProfileResponse;
        try {
            userProfileResponse = await axios.get('http://localhost:3000/user', {
                headers: {
                    "Authorization": req.headers.authorization
                }
            });
        } catch (error) {
            console.log(error);
            res.status(404).json({
                data: {
                    "message": userProfileResponse.data
                }
            });
        }

        currentUser = userProfileResponse.data.data;

        try {
            db.query("INSERT INTO purchase (corresponding_user_id, title, first_name, last_name, flight_serial, offer_price, offer_class, transaction_id, transaction_result) VALUES($1, 'ticket', $2, $3, $4, $5, $6, $7, $8)",
                [currentUser.User_id, currentUser.First_name, currentUser.Last_name, req.body.flight_serial, req.body.offer_price, req.body.offer_class, transactionId, successTransactionResult]);
        } catch (error) {
            console.log(error);
        }

        res.status(200).json({
            data: {
                "message": 'success'
            }
        });
    }


});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`server is up and listening on port ${port}`);
});
