import http from "@ducor/http-client"
import {  useEffect, useState } from "react"
import useStore from "./useStore";

const useGet = (url: string) => {

    const [data, setData, isPrevFetched] = useStore(undefined, url);
    const [isLoading, setIsLoading] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [error, setError] = useState(null);
    const [wasSuccessful, setWasSuccessful] = useState(false);

    useEffect(( ) => {

        const feactData = async () => {

            setHasErrors(false);
            setWasSuccessful(false);
            setIsLoading(true);
            try {
                const response = await http.get(url);
                setData(response.data);
                // setData(response.data)
            } catch (error: any) {
                console.error(error)

                if(error && (error as any).resposne && (error as any).response.message){

                    setError((error as any).response.message);
                }
                setHasErrors(true);
            }finally{
                setIsLoading(false)
            }
        }

        if(isPrevFetched === undefined){
            feactData();
        }


    }, [url, data]);


    return { data, isLoading, hasErrors, error, wasSuccessful };

}


export default useGet;