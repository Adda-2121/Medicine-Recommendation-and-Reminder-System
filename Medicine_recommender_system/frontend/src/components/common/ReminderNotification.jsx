import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import io from 'socket.io-client';
import { Bell, X } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
// Only create outside component so it persists across renders
const socket = io(SOCKET_URL);

const ReminderNotification = () => {
    const { user } = useContext(AuthContext);
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        if (user) {
            // Join personal room
            socket.emit('join_user_room', user.id);
            
            // Listen for push alerts
            const handleAlert = (reminder) => {
                if (reminder.patient_id === user.id) {
                    setAlerts(prev => [...prev, reminder]);
                    playAlarm();
                }
            };
            
            socket.on('reminder_alert', handleAlert);
            
            return () => {
                socket.off('reminder_alert', handleAlert);
            };
        }
    }, [user]);

    const playAlarm = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            // Create a beep-beep sound simulation
            const playBeep = (startTime) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, startTime);
                osc.frequency.setValueAtTime(1200, startTime + 0.1);
                
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(1, startTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, startTime + 0.25);
                
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            };
            
            // Play double beep
            playBeep(ctx.currentTime);
            playBeep(ctx.currentTime + 0.35);

        } catch (err) {
            console.error('Web Audio API disabled or unsupported', err);
        }
    };

    const removeAlert = (id) => {
        setAlerts(prev => prev.filter(r => r.id !== id));
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4">
            {alerts.map(alert => (
                <div key={alert.id} className="bg-white border-l-4 border-primary-500 shadow-2xl rounded-lg p-4 animate-bounce hover:animate-none cursor-pointer w-72 transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center">
                            <div className="bg-primary-100 p-2 rounded-full mr-3 shrink-0">
                                <Bell className="text-primary-600 animate-pulse" size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 capitalize leading-tight mb-1">
                                    {alert.reminder_type === 'medicine' && alert.medicine_name ? alert.medicine_name : alert.reminder_type.replace('_', ' ')} Reminder
                                </h4>
                                {alert.reminder_type === 'medicine' ? (
                                    <div className="text-xs text-slate-600 mt-1 flex flex-col gap-0.5">
                                        {alert.medicine_type && <span><span className="font-semibold">Type:</span> {alert.medicine_type}</span>}
                                        {alert.dose && <span><span className="font-semibold">Dose:</span> {alert.dose}</span>}
                                        {alert.frequency && <span><span className="font-semibold">Frequency:</span> {alert.frequency}</span>}
                                        <span className="text-primary-600 font-bold mt-1">Time's up! Please take your medicine.</span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Time's up! Check your schedule!
                                    </p>
                                )}
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }} className="text-slate-400 hover:text-slate-600 ml-2 mt-1">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReminderNotification;
