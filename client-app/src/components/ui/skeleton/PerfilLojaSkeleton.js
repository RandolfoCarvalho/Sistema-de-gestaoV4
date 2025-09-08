import React from 'react';
// Importando o esqueleto base. O caminho é relativo ao diretório atual.
import { Skeleton } from './skeleton.jsx';

const PerfilLojaSkeleton = () => {
    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
            <div className="max-w-md mx-auto">
                <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-b-3xl">
                    <Skeleton className="w-28 h-28 rounded-full mx-auto border-4 border-gray-200 dark:border-gray-700 -mb-14" />
                </div>
                <div className="pt-20 px-6 pb-6 text-center space-y-3">
                    <Skeleton className="h-8 w-3/4 mx-auto bg-gray-300" />
                </div>
                <div className="px-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-5">
                        <div className="flex items-start space-x-4">
                            <Skeleton className="w-5 h-5 rounded-full mt-1 bg-gray-200" />
                            <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/3 bg-gray-200" />
                                <Skeleton className="h-4 w-2/3 bg-gray-200" />
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Skeleton className="w-5 h-5 rounded-full mt-1 bg-gray-200" />
                            <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/3 bg-gray-200" />
                                <Skeleton className="h-4 w-1/2 bg-gray-200" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4">
                        <div className="flex items-start space-x-4">
                            <Skeleton className="w-5 h-5 rounded-full mt-1 bg-gray-200" />
                            <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/3 bg-gray-200" />
                                <Skeleton className="h-4 w-full bg-gray-200" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full rounded-lg bg-gray-300" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                        <Skeleton className="h-12 w-full rounded-lg bg-gray-300" />
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2">
                <div className="flex justify-around">
                    <Skeleton className="h-10 w-16 bg-gray-200"/>
                    <Skeleton className="h-10 w-16 bg-gray-200"/>
                    <Skeleton className="h-10 w-16 bg-gray-200"/>
                    <Skeleton className="h-10 w-16 bg-gray-200"/>
                </div>
            </div>
        </div>
    );
};

export default PerfilLojaSkeleton;