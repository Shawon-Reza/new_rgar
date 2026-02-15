

const CommonButton = ({ type, text, className = '', onClick }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`px-4 py-2 font-semibold rounded bg-[#00A4A6] text-white hover:bg-[#008C8E] cursor-pointer transition ${className}`}
        >
            {text}
        </button>
    );
};

export default CommonButton;
