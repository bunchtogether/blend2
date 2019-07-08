//      

                              
                           
                                 
                                       
                                        
                                        
                          
 

(x                 ) => (x             ); // eslint-disable-line no-unused-expressions
class AbstractAdapter {
  static async discover()             {
    throw new Error('Static method discover is not implemented.');
  }

  initialize()             { // eslint-disable-line no-unused-vars
    throw new Error('Method initialize is not implemented.');
  }

  pair(data        )             { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }

  setPower(power         )             { // eslint-disable-line no-unused-vars
    throw new Error('Method setPower is not implemented.');
  }

  setVolume(volume        )             { // eslint-disable-line no-unused-vars
    throw new Error('Method setVolume is not implemented.');
  }

  setSource(source        )             { // eslint-disable-line no-unused-vars
    throw new Error('Method setSource is not implemented.');
  }

  getDevice()             { // eslint-disable-line no-unused-vars
    throw new Error('Method pair is not implemented.');
  }
}

module.exports = AbstractAdapter;
