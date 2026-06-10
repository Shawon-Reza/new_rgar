import React from "react";

const buildMemberImageSrc = (image, baseUrl) => {
    if (typeof image !== "string" || image.trim().length === 0) return null;
    if (image.startsWith("http")) return image;
    return `${baseUrl}${image}`;
};

const GroupAvatar = ({ members = [], baseUrl, fallbackSrc, className = "" }) => {
    const memberImages = members
        .map((member) => buildMemberImageSrc(member?.image, baseUrl))
        .filter(Boolean)
        .slice(0, 4);

    if (memberImages.length === 0) {
        return (
            <img
                src={fallbackSrc}
                alt="Group"
                className={`w-10 h-10 rounded-full object-cover ${className}`}
            />
        );
    }

    return (
        <div
            className={`grid grid-cols-2 grid-rows-2 gap-0.5 w-10 h-10 rounded-full overflow-hidden bg-gray-200 ${className}`}
            aria-label="Group members"
        >
            {memberImages.map((src, index) => (
                <img
                    key={`${src}-${index}`}
                    src={src}
                    alt="Member"
                    className="w-full h-full object-cover"
                />
            ))}
        </div>
    );
};

export default GroupAvatar;
