import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AgencyID, IncidentParticipant } from '@/lib/mockData';

export const useWarRoom = (incidentId: string, userAgency: AgencyID) => {
    const [participants, setParticipants] = useState<IncidentParticipant[]>([]);

    useEffect(() => {
        // Default to localhost if env var is not set, to prevent crash
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
        const socket = io(socketUrl);

        // Join the specific incident "Room"
        socket.emit('join-incident', { incidentId, userAgency });

        socket.on('participant-update', (data: IncidentParticipant[]) => {
            setParticipants(data);
        });

        return () => {
            socket.emit('leave-incident', { incidentId });
            socket.disconnect();
        };
    }, [incidentId, userAgency]);

    return { participants };
};
