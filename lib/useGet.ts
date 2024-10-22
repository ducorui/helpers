import http from "@ducor/http-client"
import {  useEffect, useState } from "react"
import { useStore } from "./useStore";

const useGet = (url: string) => {

    const {data, updateStore} = useStore(url);
    const [isLoading, setIsLoading] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [error, setError] = useState(null);
    const [wasSuccessful, setWasSuccessful] = useState(false);

    useEffect(( ) => {

        const feactData = async () => {

            updateStore(url, null, 'wait');

            setHasErrors(false);
            setWasSuccessful(false);
            setIsLoading(true);
            try {
                const response = await http.get(url);
                updateStore(url, response.data);
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

        if(data.status === "start"){
            feactData();
        }


    }, [url, data]);


    return { data: data.data, isLoading, hasErrors, error, wasSuccessful };

}


export default useGet;