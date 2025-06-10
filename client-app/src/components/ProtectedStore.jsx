import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from './Context/StoreContext';

const ProtectedStore = () => {
    const { currentStore } = useStore(); 

    const navigate = useNavigate();

    return <Outlet />;
};

export default ProtectedStore;
