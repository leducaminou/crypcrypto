"use client";
import Image from "next/image";
import { Disclosure } from "@headlessui/react";
import { Faqdata, Faqdataplus } from "@/app/lib/data";
import { ChevronUp } from "lucide-react";
import { useState } from "react";

const Faq = () => {

   const [isHidden, SetIsHidden] = useState(false)

    const HiddenHandler = () => {
        if(isHidden){
            SetIsHidden(false)
        }
 if(!isHidden){
            SetIsHidden(true)
        }
    }

  return (
    <section>
      <div
        className="py-8 md:py-16 container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 relative z-10"
        id="faq"
      >
        <h3 className="text-center text-3xl lg:text-5xl font-bold text-white mb-3">
          Frequently Asked And Question
        </h3>
        <p className="text-center lg:text-lg font-normal text-white/40">
        Trouvez rapidement des réponses à vos questions les plus courantes sur notre plateforme de trading IA.
         
        </p>
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2">
            <div>
              <div className="w-full px-4 pt-16">
                {Faqdata.map((items, i) => (
                  <div
                    className="mx-auto w-full max-w-5xl rounded-2xl bg-darkmode py-8 px-6 mb-5"
                    key={i}
                  >
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg text-white/80 sm:px-4 sm:py-2 text-left md:text-2xl font-medium">
                            <span>{items.heading}</span>
                            <ChevronUp
                              className={`${
                                open ? "rotate-180 transform" : ""
                              } text-2xl text-purple-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2 md:text-lg text-white/40 font-normal">
                            {items.subheading}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                ))}
  {isHidden && Faqdataplus.map((items, i) => (
                  <div
                    className="mx-auto w-full max-w-5xl rounded-2xl bg-darkmode py-8 px-6 mb-5"
                    key={i}
                  >
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg text-white/80 sm:px-4 sm:py-2 text-left md:text-2xl font-medium">
                            <span>{items.heading}</span>
                            <ChevronUp
                              className={`${
                                open ? "rotate-180 transform" : ""
                              } text-2xl text-purple-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2 md:text-lg text-white/40 font-normal">
                            {items.subheading}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                ))}

            

                <div className="flex justify-center ">
                  <button 
                  onClick={HiddenHandler}
                  className="bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white">
                    {isHidden ? "Voir moins" : "Voir plus"}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-32">
              <Image
                src={"/images/faq/faq.svg"}
                alt="faq-image"
                width={941}
                height={379}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;
