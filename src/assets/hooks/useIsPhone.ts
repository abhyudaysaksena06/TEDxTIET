import { useEffect, useState } from "react";

/** True on phone-width viewports. Drives the hero's fit mode and the
 *  gallery's cylinder-instead-of-sphere layout. */
export function useIsPhone(maxWidth = 767) {
    const [isPhone, setIsPhone] = useState(
        typeof window !== "undefined" ? window.innerWidth <= maxWidth : false
    );

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
        const on = () => setIsPhone(mq.matches);
        on();
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, [maxWidth]);

    return isPhone;
}

export default useIsPhone;
