
CREATE TABLE IF NOT EXISTS rooms (
  pin VARCHAR(10) PRIMARY KEY,  
  host VARCHAR(255),           
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE  IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pin VARCHAR(10),             
  player VARCHAR(255),        
  FOREIGN KEY (pin) REFERENCES rooms(pin)
);