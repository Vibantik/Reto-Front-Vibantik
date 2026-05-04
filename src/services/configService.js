const API_URL = 'http://localhost:3000';

export const fetchUserSettings = async (uuid) => {
    try {
        const response = await fetch(`${API_URL}/api/settings/${uuid}`);

        if (!response.ok) {
            throw new Error(`Error al obtener la configuración, estado: ${response.status}`);
        }
        const data = await response.json();

        return {
            1: data.activ_categ,
            2: data.activ_presupuestos,
            3: data.activ_metas,
            4: data.activ_metas,
            5: data.activ_reportes,
            6: data.activ_ia,
            7: data.activ_alertas
        };
    } catch (error) {
        console.error("Error al obtener la configuración del usuario:", error);
        return null;
    }
};

export const saveUserSettings = async (uuid, toggleStates) => {
    try {
        const payload = {
            uuid_de_usuario: uuid,
            activ_categ: toggleStates[1],
            activ_presupuestos: toggleStates[2],
            activ_metas: toggleStates[3],
            activ_reportes: toggleStates[5],
            activ_ia: toggleStates[6],
            activ_alertas: toggleStates[7]
        };

        const response = await fetch(`${API_URL}/api/settings/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        return response.ok;
    } catch (error) {
        console.error("Error al guardar la configuración del usuario:", error);
        return false;
    }
};
