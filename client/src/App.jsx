import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import OrderSnacks from './pages/OrderSancks.jsx'
import Packages from './pages/Packages.jsx'
import Layout from './pages/admin/Layout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import AddShows from './pages/admin/AddShows.jsx'
import ListShows from './pages/admin/ListShows.jsx'
import ListBooking from './pages/admin/ListBooking.jsx'
import ManageSnacks from './pages/admin/ManagSnacks.jsx'
import { useAppContext } from './context/AppContext.jsx'
import { SignIn } from '@clerk/clerk-react'
import AddUpcoming from './pages/admin/AddUpcoming.jsx'
import ListUpcoming from './pages/admin/ListUpcoming.jsx'
import UpcomingDetail from './pages/UpcomingDetail.jsx'
import ReservationForm from './components/ReservationForm.jsx'
import AdminReservations from './pages/admin/AdminReservations.jsx'
import AdminAddManualMovie from './pages/admin/AdminAddManualMovie.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'
import PaymentSuccess from './pages/PaymentSuccess.jsx'
import PaymentFailed from './pages/PaymentFailed.jsx'



const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  const { user } = useAppContext()

  
  return (
    <>
    <Toaster/>
     {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/Movies' element={<Movies/>}/>
       {/* <Route path='/Movies/:id' element={<MovieDetails/>}/>*/}
       <Route path='/movie/:id' element={<MovieDetails />} />

       <Route path='/Movies/:id/:date' element={<SeatLayout />}/>
       <Route path='/reserve' element={<ReservationForm/>} />

        <Route path='/Movies/:id/:date/:Snacks' element={<OrderSnacks />}/>
        <Route path='/my-bookings' element={<MyBookings />}/>
       <Route path='/upcoming/:id' element={<UpcomingDetail/>}/>
        <Route path='/favorite' element={<Favorite/>}/>
        <Route path='/packages' element={<Packages />}/>
       <Route path='/privacy-policy' element={<PrivacyPolicy />}/>
       <Route path='/payment/success' element={<PaymentSuccess />}/>
       <Route path='/payment/failed' element={<PaymentFailed />}/>

      <Route path='/admin/*' element={ user ? <Layout/> : (
        <div className='min-h-screen flex justify-center items-center'>
          <SignIn  fallbackRedirectUrl={'/admin'} />
      
      </div>
      )}>
      <Route index element={<Dashboard/>}/>
      <Route path='add-shows' element={<AddShows/>}/>
      <Route path='list-shows' element={<ListShows/>}/>
      <Route path='list-booking' element={<ListBooking/>}/>
       <Route path="ManageSnacks" element={<ManageSnacks />} />
       <Route path="AddUpcoming" element={<AddUpcoming />} />
       <Route path='List-Upcoming'element={<ListUpcoming/>} />
       <Route path='List-Reservation' element={<AdminReservations/>}/>
       <Route path='Add-Movie' element={<AdminAddManualMovie/>}/>


      </Route>


      </Routes>
       {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App