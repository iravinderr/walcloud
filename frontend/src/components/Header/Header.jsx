import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuthNavigation from "../../hooks/AuthNavigation";
import { deleteRequestAxios, postRequestAxios } from "../../services/requests";
import { deleteAccountAPI, logoutAPI } from "../../services/apis";
import { APP_NAME } from "../../constants";
import StorageInfo from "./StorageInfo";
import toast from "react-hot-toast";
import { RedButton } from "../";

function Header() {
  const { authenticated, setAuthenticated } = useAuthNavigation();
  const [showConfirmDeletion, setShowCofirmDeletion] = useState(false);

  const setConfirmDeletion = () => setShowCofirmDeletion(true);

  const handleLogout = async () => {
    try {
      const response = await postRequestAxios(logoutAPI);
      if (response.data.success) {
        setAuthenticated(false);
        toast.success(response.data.message);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      const response = await deleteRequestAxios(deleteAccountAPI);
      if (response.data.success) {
        toast.success(response.data.message);
        setAuthenticated(false);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const navItems = [
    {
      name: "Login",
      path: "/login",
      active: !authenticated,
    },
    {
      name: "Register",
      path: "/register",
      active: !authenticated,
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      active: authenticated,
    },
    {
      name: "Profile",
      path: "/profile",
      active: authenticated,
    },
  ];

  return (
    <header className="sticky top-0 z-50 ">
      <nav className="h-16 w-screen p-2 flex justify-evenly Header bg-CustomBlack gap-2">
        <div className="w-1/3 flex justify-center items-center  ">
          <Link to="/" className="p-3 text-white hover:bg-[#555] rounded-md font-Crusader">
            <div className='flex'>
              <h1 className='text-xl font-TitanOne text-CustomBlue'>{APP_NAME}</h1>
            </div>
          </Link>
        </div>
        <ul className="w-2/3 flex justify-evenly items-center">
          {navItems.map((item) =>
            item.active ? (
              <li key={item.name}>
                <NavLink className={({isActive}) => `p-3 text-white ${isActive ? `bg-[#555]` : ``} hover:bg-[#555] rounded-md`} to={item.path}>{item.name}</NavLink>
              </li>
            ) : null
          )}
          {authenticated && (
            <li>
              <RedButton onClick={handleLogout}>Logout</RedButton>
            </li>
          )}
          {authenticated && (
            <li>
              {!showConfirmDeletion ? (
                <RedButton onClick={setConfirmDeletion}>
                  Delete Account
                </RedButton>
              ) : (
                <RedButton onClick={handleAccountDeletion}>
                  Confirm Deletion
                </RedButton>
              )}
            </li>
          )}
          {authenticated && (
            <li>
              <StorageInfo />
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
