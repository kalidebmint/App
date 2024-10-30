var bcrypt= require('bcrypt');

let password = "Rev500Rev8$Rev5Rev55";


var hashPassword = async function(){
    console.log(bcrypt.hash(password,10));
    var hashPwd = await bcrypt.hash(password,10);
    console.log(hashPwd);
}

hashPassword();