import Link from 'next/link'
import React from 'react'
import Button from './Button'
import { useRouter } from 'next/navigation'

interface Props {
    hidden?: boolean;
}

const ReferralNotExist = ({
    hidden
}: Props) => {
    const router = useRouter()
    
    const redirectPath = process.env.NEXT_PUBLIC_WEB_PATH ? process.env.NEXT_PUBLIC_WEB_PATH+'request-a-code'  : '/'

    const handleClick = () => {
        router.push(redirectPath) // Redirige vers la page d'accueil
    }

    return (
        <div className={`${hidden ? 'hidden' : 'flex flex-col justify-center'}  transition-all duration-300 ease-in-out`}>
            <Button variant='danger' onClick={handleClick}>
                Demander un code
            </Button>
        </div>
    )
}

export default ReferralNotExist