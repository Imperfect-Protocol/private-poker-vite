// src/pages/LobbyPage.jsx
import { useParams } from 'react-router-dom';
import LobbyClient from '@/components/LobbyClient'

export default function LobbyPage() {
    // Get the ID directly from the URL
    const { id } = useParams();

    return <LobbyClient id={id} />;
}