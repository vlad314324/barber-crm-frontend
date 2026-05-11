import { useParams, Link } from 'react-router-dom';
import { 
  User, Calendar, Phone, Mail, Clock, Scissors, 
  ArrowLeft, Edit, Trash, Plus 
} from 'lucide-react';

const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  
  // Mock client data
  const client = {
    id: id,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    visits: 8,
    lastVisit: "2023-10-15",
    createdAt: "2022-06-08",
    image: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=500",
    notes: "Prefers scissors cut over clippers. Always books with Mike.",
    appointments: [
      {
        id: "1",
        date: "2023-10-15",
        time: "10:30 AM",
        service: "Haircut & Beard Trim",
        barber: "Mike Johnson",
        status: "Completed",
        price: "$45.00"
      },
      {
        id: "2",
        date: "2023-09-12",
        time: "02:15 PM",
        service: "Classic Haircut",
        barber: "Mike Johnson",
        status: "Completed",
        price: "$30.00"
      },
      {
        id: "3",
        date: "2023-08-05",
        time: "11:00 AM",
        service: "Full Service",
        barber: "Robert Taylor",
        status: "Completed",
        price: "$60.00"
      }
    ],
    preferredServices: ["Classic Haircut", "Beard Trim", "Hot Towel Shave"],
    favoriteBarber: "Mike Johnson"
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link 
          to="/clients" 
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Clients
        </Link>
      </div>
      
      {/* Client header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <img 
                className="h-16 w-16 rounded-full object-cover mr-4" 
                src={client.image} 
                alt={client.name} 
              />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                <p className="text-sm text-gray-600">Client since {formatDate(client.createdAt)}</p>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Edit size={16} className="mr-2 text-gray-500" />
                Edit
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Calendar size={16} className="mr-2" />
                New Appointment
              </button>
            </div>
          </div>
        </div>
        
        {/* Client details */}
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Phone size={16} className="mr-1 text-gray-400" />
                Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Mail size={16} className="mr-1 text-gray-400" />
                Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Clock size={16} className="mr-1 text-gray-400" />
                Last Visit
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(client.lastVisit)}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User size={16} className="mr-1 text-gray-400" />
                Favorite Barber
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{client.favoriteBarber}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Scissors size={16} className="mr-1 text-gray-400" />
                Preferred Services
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {client.preferredServices.join(', ')}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Visits</dt>
              <dd className="mt-1 text-sm text-gray-900">{client.visits}</dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{client.notes}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Appointment history */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Calendar size={20} className="mr-2 text-indigo-600" />
              Appointment History
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Past and upcoming appointments
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus size={14} className="mr-1" />
            Add
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barber
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {client.appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(appointment.date)}</div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.service}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.barber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${appointment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Danger zone */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-red-600">Danger Zone</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Destructive actions that cannot be undone
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash size={16} className="mr-2" />
            Delete Client
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;