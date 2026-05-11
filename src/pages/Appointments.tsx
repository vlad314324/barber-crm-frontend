import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { appointmentApi, clientApi, employeeApi, serviceApi } from '../api';
import { Appointment, Client, Employee, Service } from '../api/types';

const Appointments = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsData, clientsData, employeesData, servicesData] = await Promise.all([
          appointmentApi.getAll(),
          clientApi.getAll(),
          employeeApi.getAll(),
          serviceApi.getAll(),
        ]);
        setAppointments(appointmentsData);
        setClients(clientsData);
        setEmployees(employeesData);
        setServices(servicesData);
      } catch (err) {
        setError('Failed to fetch data.');
        console.error('Error fetching data for appointments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getClient = (ref: string | Client): Client | undefined => {
  const id = typeof ref === 'string' ? ref : ref._id;
  return clients.find(c => c._id === id);
};

const getEmployee = (ref: string | Employee): Employee | undefined => {
  const id = typeof ref === 'string' ? ref : ref._id;
  return employees.find(e => e._id === id);
};

const getServiceNames = (refs: (string | Service)[]): string => {
  return refs
    .map(ref => {
      const id = typeof ref === 'string' ? ref : ref._id;
      return services.find(s => s._id === id)?.name || 'Unknown';
    })
    .join(', ');
};


  const handlePrevious = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() - 7);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const timeSlots = Array.from({ length: 18 }, (_, i) => { // 9 AM to 6 PM
    const hour = 9 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const formattedHour = hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${formattedHour}:${minute === 0 ? '00' : minute} ${ampm}`;
  });

  const getDayAppointments = (date: Date) => {
    return appointments.filter(appt => {
      const apptDate = new Date(appt.date);
      return apptDate.toDateString() === date.toDateString();
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar size={24} className="mr-2 text-indigo-600" />
          Appointments
        </h1>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={16} className="mr-2" />
          Add New Appointment
        </button>
      </div>

      {/* Calendar navigation and view mode toggle */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-lg font-medium text-gray-900">
              {viewMode === 'day'
                ? currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
            <button
              onClick={handleNext}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${viewMode === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="relative">
          <div className="overflow-x-auto">
            <div className="flex">
              {/* Time column */}
              <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
                <div className="h-14"></div> {/* Empty space for date header */}
                {timeSlots.map((slot, i) => (
                  <div key={i} className="h-16 flex items-center justify-center text-xs text-gray-500 border-t">
                    {slot}
                  </div>
                ))}
              </div>

              {/* Days column */}
              <div className="flex-1 grid" style={{ gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7, 1fr)' }}>
                {viewMode === 'day' ? (
                  <div className="border-b">
                    <div className="h-14 font-medium text-center py-2">
                      <div>{currentDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={`text-xl ${
                        currentDate.toDateString() === new Date().toDateString() ? 'bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                      }`}>
                        {currentDate.getDate()}
                      </div>
                    </div>
                    <div className="min-h-[1216px] relative">
                      {timeSlots.map((slot, j) => (
                        <div key={j} className="h-16 border-t"></div>
                      ))}
                      {getDayAppointments(currentDate).map(appointment => {
                        const apptTime = new Date(`2000/01/01 ${appointment.startTime}`);
                        const startHour = apptTime.getHours();
                        const startMinute = apptTime.getMinutes();
                        const totalMinutes = startHour * 60 + startMinute;
                        const topPosition = (totalMinutes - (9 * 60)) / 30 * 32; // (minutes from 9 AM / 30 minutes per slot) * height of slot (16*2)
                        const height = (appointment.totalDuration / 30) * 32;

                        const client = getClient(appointment.client);
                        const employee = getEmployee(appointment.employee);
                        const serviceNames = getServiceNames(appointment.services);


                        return (
                          <div
                            key={appointment._id}
                            className="absolute right-0 left-0 bg-indigo-500 text-white rounded-md p-2 text-xs overflow-hidden shadow-md"
                            style={{ top: `${topPosition}px`, height: `${height}px` }}
                          >
                            <p className="font-semibold">{serviceNames}</p>
                            <p>{client?.name || 'N/A'} with {employee?.name || 'N/A'}</p>
                            <p>{appointment.startTime} - {new Date(`2000/01/01 ${appointment.startTime}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            <p>Status: {appointment.status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - date.getDay() + i);
                    return (
                      <div key={i} className="border-b border-l">
                        <div className="h-14 font-medium text-center py-2">
                          <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className={`text-xl ${
                            date.toDateString() === new Date().toDateString() ? 'bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''
                          }`}>
                            {date.getDate()}
                          </div>
                        </div>
                        <div className="min-h-[1216px] relative">
                          {timeSlots.map((slot, j) => (
                            <div key={j} className="h-16 border-t"></div>
                          ))}
                          {getDayAppointments(date).map(appointment => {
                            const apptTime = new Date(`2000/01/01 ${appointment.startTime}`);
                            const startHour = apptTime.getHours();
                            const startMinute = apptTime.getMinutes();
                            const totalMinutes = startHour * 60 + startMinute;
                            const topPosition = (totalMinutes - (9 * 60)) / 30 * 32;
                            const height = (appointment.totalDuration / 30) * 32;

                            const client = getClient(appointment.client);
                            const employee = getEmployee(appointment.employee);
                            const serviceNames = getServiceNames(appointment.services);


                            return (
                              <div
                                key={appointment._id}
                                className="absolute right-0 left-0 bg-indigo-500 text-white rounded-md p-2 text-xs overflow-hidden shadow-md"
                                style={{ top: `${topPosition}px`, height: `${height}px` }}
                              >
                                <p className="font-semibold">{serviceNames}</p>
                                <p>{client?.name || 'N/A'} with {employee?.name || 'N/A'}</p>
                                <p>{appointment.startTime}</p>
                                <p>Status: {appointment.status}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }))}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;