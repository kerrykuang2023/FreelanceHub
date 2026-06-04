const Divider = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-gray-300" />
      </div>
    </div>
  );
};

export default Divider;
