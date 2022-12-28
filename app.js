require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findorcreate = require("mongoose-findorcreate");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const cookieParser = require('cookie-parser');
const querystring = require("querystring");
const _ = require("lodash");
const { connect } = require('http2');
// const data = require('../docs/data.json');



const app = express();

mongoose.set('strictQuery', false)

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({parameterLimit: 100000, extended:true}));

//watch it
app.use(cookieParser());

app.use(session({
    secret:process.env.SECRET
    // resave: false,
    // saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb+srv://"+ process.env.DB_KEY +"@cluster0.tnsju.mongodb.net/geosistemas", {useNewUrlParser: true});
// mongoose.connect("mongodb+srv://"+ process.env.DB_KEY +"@cluster0.tnsju.mongodb.net/geosistemastest", {useNewUrlParser: true});


//setting the schemas

const userSchema = new mongoose.Schema({

    username: String,
    email:String,
    password: String,
    setor: String,
    type: String

});


//Should find a way to get the user

const projectSchema = new mongoose.Schema({
    nomeDoProjeto: String,
    centroCusto: String,
    orgao: String,
    valor: Number,
    descricao: String,
    createdBy: [userSchema],
    dataInicio: Date,
    dataTermino: Date,
    createdIn: String,
    status: String,
    colorStatus: String,
    ultimaAtualizacao: [userSchema],
    setorAtual: String,
    updatedLastDate: String,
    problemComment: String,
    percentageDone: String,
    numeroContrato: String
});



const Project = new mongoose.model("Project", projectSchema);





userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findorcreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, email: user.email });
      //wacth it
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });





app.get('/data',(req,res)=>{
    const session = req.session;
    const userId = session.passport.user.id;

    User.findOne({_id:userId}, (err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
   ;
            data.file.forEach((file)=>{
                const project = new Project({...file, 
                    createdBy:foundUser, 
                    ultimaAtualizacao:foundUser,
                 });
                project.save();
            });
            res.redirect("/projetos");
            
        }
    });



});




app.get("/", function(req, res){
    res.render("login");
    // const a = test.test()
});

app.post("/", function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/home_menu");
                

            });
        }
    });

});

app.get("/updateall", (req,res)=>{
    if(req.isAuthenticated()){
        
        const session = req.session;
        const userId = session.passport.user.id;
        let filter = {};
        let filterValue = req.query.proId;
        if(req.query.proId){
            filter = {_id:filterValue}
        }

        User.findOne({_id:userId}, (err,foundUser)=>{
            if(err){
                console.log(err);      
            }else{
                if(foundUser.type==="adm"){
                    Project.find({}, (err, foundProject)=>{

                        if(foundProject === null){
                            setTimeout(()=>{
                                res.write("<h1>Ainda não há registros de projetos</h1>");
                            }, 3000);
                            res.redirect("/home_menu");

                        }

                        Project.findOne(filter, (err, selectedProject)=>{
                            if(err){
                                console.log(err);
                            }else if( selectedProject ===null ){
                                setTimeout(()=>{
                                    res.write("<h1>Ainda não há registros de projetos</h1>");
                                }, 15000);
                                res.redirect("/home_menu");
                                res.end;
                               
                                
                                return console.log("No projects yet");
                            }
                    
                            res.render("updateall", {projetos:foundProject, selectedProject: selectedProject});
                        });
                    });
                }else{
                    res.redirect("/");
                }
            }
        });
    }else{
        res.redirect("/");
    }
});

app.post("/updateall", (req, res)=>{
    if(req.isAuthenticated()){
        const session = req.express;
        const userId = req.session.passport.user.id;

        User.findOne({_id:userId},(err, foundUser)=>{
           if(foundUser.type === "adm") {
                const proId = req.body.projectid;
                const nomeProjeto = req.body.nomeprojeto;
                const descricao = req.body.descricao;
                const problemComment = req.body.problemComment;
                const setorAtual = req.body.setorAtual;
                const orgao = req.body.orgao;
                const valor = req.body.valor;
                const centroCusto = req.body.centrocusto;

                const dateIn = new Date(req.body.dataInicio);
                const dateOut = new Date(req.body.dataTermino);
        

                const dataInicio = new Date(dateIn.setDate(dateIn.getDate()+1));
                const dataTermino = new Date(dateOut.setDate(dateOut.getDate()+1));
                const update = {};

                dataInicio == 'Invalid Date' ? upDate = {
                    nomeDoProjeto:nomeProjeto,
                    descricao: descricao,
                    problemComment:problemComment,
                    setorAtual:setorAtual,
                    orgao: orgao,
                    valor:valor,
                    centroCusto: centroCusto,
                }: upDate = {
                    nomeDoProjeto:nomeProjeto,
                    descricao: descricao,
                    problemComment:problemComment,
                    setorAtual:setorAtual,
                    orgao: orgao,
                    valor:valor,
                    centroCusto: centroCusto,
                    dataInicio: dataInicio,
                    dataTermino:dataTermino,
                }

                Project.findOneAndUpdate({_id:proId},{$push: {ultimaAtualizacao: foundUser}}, function(err, foundProject){
                    if(err){

                        console.log('error', err);
                    }
                });

                Project.findOneAndUpdate({_id:proId}, upDate, (err, foundProject)=> {
                        if(err){
                            console.log("error", err);
                        }
                    });
             
                    res.redirect("/updateall");

                


            }else{
                console.log(err);
                res.redirect("/");
            }

        });
    }
});


app.get("/deleteuser", (req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
 

        User.findOne({_id:userId}, (err, foundUser)=>{
            if(foundUser.type === "adm"){
                User.find({}, (err, foundUsers)=>{
                    if(!err){
                        res.render("deleteuser", {users:foundUsers});
                    }else{
                        console.log(err);
                        res.render("/")
                    }

                });
            }else{
                console.log(err);
            }
        })

    }

});

app.post("/deleteuser", (req, res)=>{
    const ids = req.body.checkbox;
    User.deleteMany({_id:ids},(err, foundUser)=>{
        if(!err){
            console.log(foundUser + "deletado");
            res.redirect("/deleteuser");
        } else {
            console.log(err);
        }
    })

});

app.get("/userperm", (req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        User.findOne({_id:userId},(err, foundUser)=>{
            if(foundUser.type === "adm"){
                const uTypes = [
                    {selection: "Adminsitrador Geral",
                     value: "adm"},
                     {selection: "Visualizador de Projetos",
                        value: "view"},
                    {selection: "Permissão para Alterar e Cadastrar Projetos" ,
                        value: "write"}
                ];

                User.find({}, function(err, foundUsers){
                    res.render("userperm", {users:foundUsers, userTypes:uTypes});
                });
                
            }else{
                console.log(err);
                res.redirect("/");
                
            }
        });
    }

});




app.post("/userperm", (req,res)=>{
    
    const userId = req.body.usernameId;
    const perm = req.body.type;

    User.findOneAndUpdate({_id:userId},
        {
            type:perm

    },(err, foundUser)=>{
        if(err){
            console.log(err);
        }else{
            res.redirect("/menuadm");
        }
    })


});


app.get("/menuadm",(req,res)=>{
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;
        User.findOne({_id:userId},(err, foundUser)=>{
            if(foundUser.type === "adm"){
                res.render("menu_adm");
            }else{
                console.log(err);
                res.redirect("/");
            }
        });
    }
});



app.get("/deleteupdate", function(req,res){
    if(req.isAuthenticated()){
            const session = req.session;
            const userId = session.passport.user.id;
            User.findOne({_id:userId}, function(err,foundUser){
                if(foundUser.type==="adm"){
                    Project.find({}, function(err, foundProject){

                            if(err){
                                console.log(err);
                            }else {
                                res.render("deleteupdate", {projetos:foundProject});
                            }
                        });
                    }
    
                });
       
    }
   
});


app.post("/deleteupdate", function(req,res){
    
    const ids = req.body.checkbox;
    Project.deleteMany({_id:ids}, function(err){
        if(err){
            console.log(err);
        }else{
            console.log("Projeto(s) deletado(s)");
            res.redirect("/deleteupdate");
        }
        });      

});

app.get("/home_menu",function(req,res){
    if(req.isAuthenticated()){
        const session = req.session;
        const userId = session.passport.user.id;

        User.findOne({_id:userId}, function(err, foundUser){
            if(foundUser.type === "adm"){
                res.render("home_menu_adm");
            }else if(foundUser.type === "write"){
                res.render("home_menu");
            }else {
                res.render("home_menu_view");
            }
        });
       
     
    }else{
        res.redirect("/");
    }
});

app.get("/projetos", function(req, res){
    if(req.isAuthenticated()) {
            let filter = {};

            let filter2 = {status: 'emAndamento'};

            let filter3 = {};
        
        let stringFilter = req.query.descprojeto;

        if(req.query.descprojeto){
            filter = {descricao:{$regex: stringFilter, $options:'i'}}
        }
        if(req.query.centrocusto){
            filter3 = {_id:req.query.centrocusto}
        }
        if(req.query.status){
            if(req.query.status === "all"){
                filter2={};
            }else{
                filter2 = {status:req.query.status};
                if(req.query.descprojeto){
                        filter = {descricao:{$regex: stringFilter, $options:'i'}}
                    }
                }
            }

        Project.find({$and:[filter, filter2, filter3]},  function(err, foundProjects){
            const selectList = [
                {selection:"Selecione um status",
                value:"all"},
                {selection: "Em Andamento",
                 value: "emAndamento"},
                 {selection: "Atrasado",
                    value: "atrasado"},
                {selection: "Problema" ,
                    value: "problema"},
                {selection: "Finalizado",
                    value: "finalizado"},
                {selection: "Sem Status",
                    value: "new"},
                {selection: "Todos",
                    value: "all"}
            ]

            const countRegister = foundProjects.length;

      
   

            if(err){
                console.log(err);
            }

            Project.find({}, (err, proj)=>{
                
                const projsf = proj;

                res.render("projects", {projs:foundProjects, items:selectList, counter: countRegister, projsf: projsf});
            });



        }).collation( { locale: 'en', strength: 2 } );
        
    }else{
        res.redirect("/");
    }
});




app.get("/novoprojeto", (req, res) => {

    if(req.isAuthenticated()) {
        Project.find({},(foundProject)=>{
            const centroCusto = {project: foundProject}
            res.render("projectentry", centroCusto);
        });
    }else{
        res.redirect("/");
    }
});

app.get("/statusprojeto", function(req, res){
    if(req.isAuthenticated()) {
        const selectList = [
            {selection: "Em Andamento",
             value: "emAndamento"},
             {selection: "Atrasado",
                value: "atrasado"},
            {selection: "Problema" ,
                value: "problema"},
            {selection: "Finalizado",
                value: "finalizado"}
        ]


        Project.find({}, function(err, foundProjects){
            res.render("projectstatus", {projs:foundProjects, selectList:selectList});
        });
        
    }else{
        res.redirect("/");
    }
});

app.post("/updatestatus", function(req,res){
   
   if(req.isAuthenticated()) {

        const proId = req.body.proid;
        const session = req.session;
        const userId = session.passport.user.id;
        const status = req.body.status;
        const setor = req.body.setor;
        const problemComment = req.body.problemComment;
        const percentageDone = req.body.percentageDone;
        var colorS = "projectbox";

        const now = new Date();
        

        if (status === "emAndamento"){
            colorS = "orange";
        }else if (status === "atrasado") {
            colorS = "yellow";
        }else if(status === "problema" ){
            colorS = "red";
        }else if (status === "finalizado") {
            colorS = "blue";
        }else {
            colorS = "projectbox";
        }



        User.findOne({_id:userId}, (err,foundUser)=>{
            Project.findOneAndUpdate({_id:proId},
                {$push:{ultimaAtualizacao:foundUser}}, 
                function(err, foundProject){
                    if (err){
                        res.redirect("/");
                    }
            });

        Project.findOneAndUpdate({_id:proId},
            {
                status:status,
                colorStatus:colorS,
                setorAtual:setor,
                updatedLastDate: now,
                problemComment: problemComment,
                percentageDone:percentageDone
                    }, (err, foundProject)=>{
            if(err){
                console.log(err);
                res.redirect("/");
            }
        });
    
            res.redirect("/home_menu");

        });


        
    }else {
        res.redirect("/");
    }

});


app.get("/test", function(req,res){
    if (req.isAuthenticated()){

        const session = req.session;
        const userId = session.passport.user.id;    
        
        User.findOne({_id:userId}, (err, foundUser)=>{
            if(err){
                console.log(err);
            }
        });



    }else{
        res.redirect("/");
    }


});


app.get("/projetos/:projectId", function(req, res){

    if(req.isAuthenticated){
        const requestedProjectId = req.params.projectId;

        Project.findOne({_id: requestedProjectId}, function(err, project){
            if(err){
              console.log(err) ;
            }
            if (project.status === "emAndamento"){
                var sit = "em andamento";
            }else {
                var sit = project.status;
            }

            //const ultimaAtu = project.ultimaAtualizacao[project.ultimaAtualizacao.length].username;
            const t = [];
            
            t.push(project.ultimaAtualizacao);
            a=t[0].length-1;
            const ultimaAtu = project.ultimaAtualizacao[a].username;
            const ultSetor = project.ultimaAtualizacao[a].setor;
        
            

            res.render("projectreport", {projeto: project, projetoStatus: sit, ultimaAtu:ultimaAtu, ultSetor:ultSetor});

        });



    }


});



app.post("/projectentry", function(req, res){

    if(req.isAuthenticated()){
        const session=req.session;
        const userId = session.passport.user.id;
        const now = new Date();
        const nomeProjeto = req.body.nomeprojeto;
        const centroCusto = req.body.centrocusto;
        const orgao = req.body.orgao;
        const valor = req.body.valor;
        const descricao = req.body.descricao;
        const dateIn = new Date(req.body.dataInicio);
        const dateOut = new Date(req.body.dataTermino);
        const numeroContrato = req.body.numeroContrato;

        function ConversorData(date) {
            const dd = String(date.getDate());
            const mm = String(date.getMonth());
            const yyyy = date.getFullYear();
            return (yyyy+"-"+mm+"-"+dd);
        }

        const dataInicio2 = new Date(dateIn.setDate( dateIn.getDate() + 1 ));
        const dataTermino2 = new Date(dateOut.setDate(dateOut.getDate() + 1));
        

        User.findOne({_id:userId}, (err, foundUser)=>{
                if(err){
                    console.log(err);
                }else{

                    const project = new Project({
                        nomeDoProjeto: nomeProjeto,
                        centroCusto: centroCusto,
                        orgao: orgao,
                        valor: String(valor).toLocaleString("de-DE",{minimumFractionDigits:2, maximumFractionDigits:2}),
                        descricao:descricao,
                        createdBy: foundUser,
                        dataInicio: dataInicio2,
                        dataTermino:dataTermino2,
                        createdIn: now,
                        status: "new",
                        colorStatus: "projectbox",
                        ultimaAtualizacao: foundUser,
                        setorAtual: "NOVA ENTRADA",
                        updatedLastDate: now,
                        percentageDone: "0",
                        numeroContrato: numeroContrato
                    });
            
                    project.save();
                    res.redirect("/home_menu");
                    
                }
            });


    }else{
        res.redirect("/");
    }
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    })
});
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){

    if(req.body.password === req.body.confirmpassword){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/");
            }else{
                passport.authenticate("local")(req,res, function(){
                    const session = req.session;
                    const userId = session.passport.user.id;
                    const email = req.body.email;
                    const setor = req.body.setor;

                    User.findOneAndUpdate({_id:userId},
                        {email:email, setor:setor, email:email, type:"view"},
                        function(err, foundUser){
                            if(err){
                                console.log(err);
                                res.redirect("/");
                                }
                            }
                        );
                    res.redirect("/home_menu");
                });
            }
        });

    }else{
       console.log("senhas diferentes");
    }


});




let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=> {
  console.log("Server started successfully");
});
