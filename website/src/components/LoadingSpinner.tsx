

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div 
        className="w-8 h-8 md:w-12 md:h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"
      />
    </div>
  );
};
