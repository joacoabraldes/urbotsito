import sql from "mssql";

const dbSettings = {
    user: "Santi",
    password: "Yoo",
    server: "localhost",
    database: "DisneyBDD",
    options: {
        trustServerCertificate: true,
        trustedConnection: true   
    },
};

export async function getConnection() {
    try {
        const pool = await sql.connect(dbSettings);
        return pool;
    } catch (error) {
        console.error(error);
    }
}

export {sql};