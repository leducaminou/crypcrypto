import Link from "next/link";


const Simple = () => {
    return (
        <section className="py-8 md:py-16  bg-simple-bg relative before:absolute before:w-full before:h-full before:bg-arrow-bg before:bg-no-repeat before:top-10">
            <div className="">
                <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 relative z-10">
                    <h3 className="text-center text-white text-3xl lg:text-5xl font-semibold mb-6">
                        Prêt à transformer vos finances ?
                        </h3>
                    <p className="text-center text-white/40 text-xl font-normal mb-8">
                    Inscrivez-vous maintenant et obtenez un bonus de 15% sur votre premier investissement.
                    </p>
                    <div className="flex justify-center ">
                        <Link
                        href="/register"
                         className='text-xl font-semibold text-white py-4 px-6 lg:px-12 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary rounded-xl'>
                            Commencer à investir dès maintenant
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Simple;
