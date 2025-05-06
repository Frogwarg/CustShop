'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    isLockedOut: boolean;
}

export default function AdminUsers() {
    const { hasRole } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!hasRole('Admin')) {
            router.push('/login');
            return;
        }

        const fetchUsers = async () => {
            try {
                const response = await axios.get('/api/admin/users');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, [hasRole, router]);

    const columns: GridColDef[] = [
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'firstName', headerName: 'Имя', width: 150 },
        { field: 'lastName', headerName: 'Фамилия', width: 150 },
        { field: 'roles', headerName: 'Роли', width: 200, valueGetter: (params: { row: { roles: any[]; }; }) => params.row.roles.join(', ') },
        { field: 'isLockedOut', headerName: 'Заблокирован', width: 120, type: 'boolean' },
        {
            field: 'actions',
            headerName: 'Действия',
            width: 150,
            renderCell: (params: { row: { id: string; isLockedOut: boolean; }; }) => (
                <>
                    <button
                        onClick={() => handleEditRoles(params.row.id)}
                        style={{ marginRight: '8px' }}
                    >
                        Изменить роли
                    </button>
                    <button onClick={() => handleBlockUser(params.row.id)}>
                        {params.row.isLockedOut ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                </>
            ),
        },
    ];

    const handleEditRoles = async (userId: string) => {
        const newRoles = prompt('Введите новые роли (через запятую):')?.split(',').map(r => r.trim());
        if (newRoles) {
            try {
                await axios.put(`/api/admin/users/${userId}/roles`, newRoles);
                setUsers(users.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
            } catch (error) {
                console.error('Error updating roles:', error);
            }
        }
    };

    const handleBlockUser = async (userId: string) => {
        try {
            await axios.post(`/api/admin/users/${userId}/block`);
            setUsers(users.map(u => u.id === userId ? { ...u, isLockedOut: true } : u));
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    };

    return (
        <div style={{ height: 600, width: '100%', padding: '20px' }}>
            <h1>Управление пользователями</h1>
            <DataGrid
                rows={users}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10]}
                getRowId={(row: { id: any; }) => row.id}
            />
        </div>
    );
}