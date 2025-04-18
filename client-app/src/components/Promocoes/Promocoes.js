import React from 'react';
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import BottomNav from '../BottomNav';

export default function PromocoesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <HeaderPublic />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white p-10 rounded-2xl shadow-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Promoções</h1>
          <p className="text-lg text-gray-600">
            Em breve você encontrará aqui as melhores ofertas e descontos!
          </p>
          <div className="mt-6">
            <span className="text-sm text-gray-400">Fique ligado! 🛍️</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
