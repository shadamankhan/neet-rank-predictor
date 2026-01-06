import React from 'react';

/**
 * Skeleton component for loading states
 * @param {string} className - Additional CSS classes
 * @param {number} count - Number of skeleton items to render
 * @param {string} type - 'text' (default), 'circle', 'block', 'table-row'
 * @param {string} width - Width of the skeleton
 * @param {string} height - Height of the skeleton
 * @param {boolean} dark - Force dark mode style
 */
const Skeleton = ({
    className = "",
    count = 1,
    type = "text",
    width,
    height,
    style = {}
}) => {
    const skeletons = Array(count).fill(0);

    const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

    // Type-specific classes
    const typeClasses = {
        text: "h-4 w-full mb-2",
        circle: "rounded-full",
        block: "h-full w-full",
        'table-row': "", // Special handling
    };

    const combinedStyle = {
        width,
        height,
        ...style
    };

    if (type === 'table-row') {
        return (
            <>
                {skeletons.map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div></td>
                        <td className="p-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                    </tr>
                ))}
            </>
        );
    }

    return (
        <>
            {skeletons.map((_, i) => (
                <div
                    key={i}
                    className={`${baseClasses} ${typeClasses[type] || ""} ${className}`}
                    style={combinedStyle}
                />
            ))}
        </>
    );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
    return (
        <table className="w-full border-collapse mt-2">
            <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                    {Array(columns).fill(0).map((_, i) => (
                        <th key={i} className="p-4">
                            <Skeleton width="80px" height="20px" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <Skeleton type="table-row" count={rows} />
            </tbody>
        </table>
    );
};

export default Skeleton;
