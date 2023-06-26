// Post endpoints
app.post('/symbol', authenticateUser, (req, res) => {
    const { error, value } = symbolSchema.validate(req.body.symbol);
  
    if (error) {
      res.status(400).send(error.details[0].message);
    } else {
      // Logic to handle the symbol
      res.send('Symbol added successfully');
    }
  });
    
  app.post('/user', (req, res) => {
      const { error, value } = userSchema.validate(req.body);
      if (error) {
          res.status(400).send(error.details[0].message);
      } else {
          // Logic to create a new user
          res.send(`User created successfully`);
      }
  });