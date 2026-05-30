import React, { useState, useEffect } from 'react';
import { Booking, Vehicle } from '../types';
import { VEHICLES } from '../data';
import { Calendar, User, Phone, MessageSquare, Clock, Plus, Trash2, CheckCircle, Sparkles, AlertTriangle } from 'lucide-react';

interface BookingCalendarProps {
  initialVehicle?: Vehicle;
}

const TIME_SLOTS = [
  '14:00 - Los Santos Tijd',
  '15:00 - Los Santos Tijd',
  '16:30 - Los Santos Tijd',
  '18:00 - Aankomst Vliegveldsolts',
  '20:00 - Stadsspits Slot',
  '21:30 - Nachtelijke Showroom Tour',
  '23:00 - Elite Straatnacht'
];

export default function BookingCalendar({ initialVehicle }: BookingCalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDiscord, setCustomerDiscord] = useState('');
  const [vehicleId, setVehicleId] = useState(initialVehicle?.id || VEHICLES[0].id);
  const [bookingType, setBookingType] = useState<Booking['bookingType']>('Test Drive');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing bookings
  useEffect(() => {
    const saved = localStorage.getItem('veloce_showroom_bookings');
    if (saved) {
      try {
        setBookings(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing bookings', e);
      }
    } else {
      // Preset test-drive
      const defaultBooking: Booking = {
        id: 'BKG-7729',
        customerName: 'Jimmy De Santa',
        customerPhone: '555-0102',
        customerDiscord: 'DeSantaJimmy#1232',
        vehicleId: 'gt3rs',
        bookingType: 'Test Drive',
        date: '2026-05-30',
        timeSlot: '16:30 - Los Santos Tijd',
        customNotes: 'Ik wil even kijken of die dikke GT-achtervleugel beter op de weg ligt in de krappe bochten van de Great Ocean Highway.',
        status: 'Approved'
      };
      setBookings([defaultBooking]);
      localStorage.setItem('veloce_showroom_bookings', JSON.stringify([defaultBooking]));
    }
  }, []);

  // Sync state if initial vehicle changes
  useEffect(() => {
    if (initialVehicle) {
      setVehicleId(initialVehicle.id);
    }
  }, [initialVehicle]);

  const saveBookings = (updated: Booking[]) => {
    setBookings(updated);
    localStorage.setItem('veloce_showroom_bookings', JSON.stringify(updated));
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !date) return;

    const newBtn: Booking = {
      id: `BKG-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerDiscord: customerDiscord.trim() || 'GeenDiscord#0000',
      vehicleId,
      bookingType,
      date,
      timeSlot,
      customNotes: customNotes.trim() || undefined,
      status: 'Approved' // auto-approved in prototype
    };

    const updated = [newBtn, ...bookings];
    saveBookings(updated);

    // Reset fields
    setCustomerName('');
    setCustomerPhone('');
    setCustomerDiscord('');
    setCustomNotes('');
    setDate('');

    setSuccessMsg(`Afspraak succesvol geboekt! Je referentienummer voor de showroomticket is: ${newBtn.id}`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleDeleteBooking = (id: string) => {
    const updated = bookings.filter(b => b.id !== id);
    saveBookings(updated);
  };

  const getVehicleName = (id: string) => {
    return VEHICLES.find(v => v.id === id)?.name || 'Speciaal op maat gemaakt model';
  };

  const translateBookingType = (type: Booking['bookingType']) => {
    switch (type) {
      case 'Test Drive': return 'Sleutel Proefrit';
      case 'Showroom Viewing': return '1:1 Privérondleiding';
      case 'Financing Consult': return 'Lease & Financieringsgesprek';
      case 'Private Appraisal': return 'Tuning & Aanpassingsadvies';
      default: return type;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl text-left bg-gradient-to-b from-neutral-900 to-neutral-950">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-6">
        <div className="p-2.5 bg-neutral-950 rounded-lg text-amber-500 border border-neutral-800">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            Proefritten & Showroom Afspraken
          </h2>
          <p className="text-xs text-neutral-400">
            Reserveer privé showroombezoeken, proefritten of gepersonaliseerde financieel- en tuningadviesgesprekken.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-lg flex items-center gap-2.5 animate-fadeIn text-xs">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Reservation Form */}
        <form onSubmit={handleCreateBooking} className="lg:col-span-15 xlg:col-span-5 space-y-4 bg-neutral-950 p-5 rounded-lg border border-neutral-850 flex-1">
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest border-b border-neutral-850 pb-2.5 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-500" />
            Showroom Aanvraagformulier
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Volledige Naam van je Personage
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="bijv. Jimmy De Santa"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-neutral-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Telefoon in de Stad
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="555-XXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Discord Gebruikersnaam
                </label>
                <input
                  type="text"
                  placeholder="naam#0000"
                  value={customerDiscord}
                  onChange={(e) => setCustomerDiscord(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-neutral-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Type Sessie / Dienst
                </label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as Booking['bookingType'])}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
                >
                  <option value="Test Drive">Exclusieve Proefrit</option>
                  <option value="Showroom Viewing">1-op-1 Privérondleiding</option>
                  <option value="Financing Consult">Lease & Financieringsgesprek</option>
                  <option value="Private Appraisal">Tuning & Aanpassingsadvies</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Selecteer Voertuig
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
                >
                  {VEHICLES.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Gewenste Datum
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3.5 py-1.5 text-xs text-slate-200 cursor-pointer font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                  Voorkeurstijdstip
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Speciale verzoeken of opmerkingen voor personeel
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <textarea
                  rows={2}
                  placeholder="bijv. Zorg ervoor dat de motor Stage 3 is afgesteld voor de proefrit, ontmoet elkaar bij de Maze Tower..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-amber-500 focus:outline-none rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder-neutral-600 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
          >
            Bevestig Afspraakticket
          </button>
        </form>

        {/* Schedule List / Active showroom tickets */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-neutral-850 pb-2.5">
            <Clock className="w-4 h-4 text-amber-500" />
            GEREGISTREERDE AFSPRAAK-TICKETS
          </h3>

          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-2">
            {bookings.length === 0 ? (
              <div className="p-12 text-center bg-neutral-950/80 border border-neutral-800 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto mb-2 animate-bounce-subtle" />
                <p className="text-xs font-semibold text-neutral-400">Er zijn momenteel geen actieve showroomafspraken.</p>
                <p className="text-[10px] text-neutral-500 mt-1">Plan je VIP-bezichtiging met het formulier aan de linkerkant.</p>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="bg-neutral-950 border border-neutral-850 hover:border-neutral-750 p-4 rounded-lg transition-all relative overflow-hidden group">
                  {/* Decorative Border Accent */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-500 to-amber-600"></div>

                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          {b.id}
                        </span>
                        <span className="text-xs font-extrabold text-slate-100">{translateBookingType(b.bookingType)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-neutral-900 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono">
                          {b.status === 'Approved' ? 'Goedgekeurd' : b.status === 'Pending' ? 'In Afwachting' : 'Voltooid'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-slate-200">
                          Aanvrager: <strong className="font-bold">{b.customerName}</strong>
                        </p>
                        <p className="text-neutral-400 flex items-center gap-1">
                          Product-Doelwit: <span className="font-bold text-slate-300">{getVehicleName(b.vehicleId)}</span>
                        </p>
                        <p className="text-neutral-400 flex items-center gap-1">
                          Telefoon: <span className="font-semibold text-slate-300 font-mono">{b.customerPhone}</span> | Discord: <span className="font-mono text-neutral-300">{b.customerDiscord}</span>
                        </p>
                        {b.customNotes && (
                          <div className="bg-neutral-900 border border-neutral-850 p-2 rounded text-[11px] text-neutral-400 italic mt-2.5 max-w-md">
                            &ldquo;{b.customNotes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-200 font-mono">{b.date}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">{b.timeSlot}</div>
                      </div>

                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className="p-1 px-2.5 bg-neutral-900 hover:bg-red-500/10 hover:border-red-500 text-neutral-500 hover:text-red-400 border border-neutral-800 rounded text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Annuleer Ticket
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-left">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-[11px] text-neutral-400 leading-relaxed">
              <strong className="text-slate-200 block mb-0.5 underline uppercase tracking-wider">VIP Prioriteitsdienst</strong>
              De showroommedewerkers in de stad ontvangen direct een radio-notificatie van deze VIP-boeking. Zorg dat je 5 minuten voor het geplande tijdstip bij de Veloce-showroom aanwezig bent. Zorg dat je dit bevestigde ticket kunt tonen!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
