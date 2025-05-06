"use client"

import { useEffect, useState } from "react";
import authService from "./../services/authService";

interface Role {
    id: number;
    name: string;
    description: string;
}

const Roles = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDescription, setNewRoleDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await authService.axiosWithRefresh<Role[]>('get', '/Roles');
                setRoles(data);
                console.log("Roles fetched:", data);
            } catch (error) {
                console.error("Error fetching roles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    const handleAddRole = async () => {
        if (!newRoleName || !newRoleDescription) {
            setError("Both name and description are required.");
            return;
        }
        try {
            const newRole = await authService.axiosWithRefresh<Role>('post', '/Roles', {
                Name: newRoleName,
                Description: newRoleDescription,
                Permissions: "{\"canRead\": true, \"canWrite\": false}"
            });
            setRoles((prevRoles) => [...prevRoles, newRole]);
            setNewRoleName("");
            setNewRoleDescription("");
            setError(null);
        } catch (error) {
            console.error("Error adding role:", error);
            setError("Failed to add new role.");
        }
    };

    if (loading) return <p>Loading roles...</p>;

    return (
        <div>
            <h1>Roles</h1>
            <ul>
                {roles.map((role) => (
                    <li key={role.id}>
                        <strong>{role.name}</strong>: {role.description}
                    </li>
                ))}
            </ul>

            <h2>Add New Role</h2>
            <div>
                <input
                    type="text"
                    placeholder="Role Name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Role Description"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                />
                <button onClick={handleAddRole}>Add Role</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </div>
        </div>
    );
    if (roles.length === 0) return <p>No roles available.</p>;
};

export default Roles;