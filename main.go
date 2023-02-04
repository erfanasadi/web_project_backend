package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/dgrijalva/jwt-go"
	_ "github.com/lib/pq"
)

const (
	secret = "supersecretkey"
)

var db *sql.DB

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func main() {
	var err error
	db, err = sql.Open("postgres", "user=postgres password=secret dbname=mydatabase sslmode=disable")
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	defer db.Close()

	http.HandleFunc("/login", login)
	http.HandleFunc("/register", register)

	err = http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatalf("Error starting the server: %v", err)
	}
}

func login(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Error decoding request body", http.StatusBadRequest)
		return
	}

	// Query the database to check if the user exists and the password is correct
	var id int
	err = db.QueryRow("SELECT id FROM users WHERE username=$1 AND password=$2", creds.Username, creds.Password).Scan(&id)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Username or password is incorrect", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Error querying the database", http.StatusInternalServerError)
		return
	}

	// Create the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": id,
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		http.Error(w, "Error signing the token", http.StatusInternalServerError)
		return
	}

	w.Write([]byte(tokenString))
}

func register(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Error decoding request body", http.StatusBadRequest)
		return
	}

	// Insert the new user into the database
	var id int
	err = db.QueryRow("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", creds.Username, creds.Password).Scan(&id)
	if err != nil {
		http.Error(w, "Error inserting the user into the database", http.StatusInternalServerError)
		return
	}

	// Create the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": id,
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		http.Error(w, "Error signing the token", http.StatusInternalServerError)
		return
	}

	w.Write([]byte(tokenString))
}
